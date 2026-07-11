import { NextRequest, NextResponse } from "next/server";
import type { CaseStage, Lead } from "@/generated/prisma/client";
import { AutomationTrigger } from "@/generated/prisma/client";
import { runAutomations } from "@/lib/automations";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { transitionCaseStage, logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { LOST_REASONS, DISQUALIFIED_REASONS } from "@/lib/case-stages";
import { funnelStageLabel, NN_FUNNEL_STAGES, type NnFunnelStage } from "@/lib/neuronourish-funnel";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import { enrollPostDiscoveryNurtureIfEligible, enrollMissedDiscoveryCallNurture, enrollMissedB2BBriefingNurture, cancelMissedDiscoveryCallNurture, cancelMissedB2BBriefingNurture } from "@/lib/neuronourish-nurture";
import { enrollLinkedInOutreachTask } from "@/lib/neuronourish-linkedin-outreach";
import { isNeuronourish } from "@/lib/vertical-config";
import { canEnrollWinback } from "@/lib/winback-eligibility";
import { enrollWinback } from "@/lib/winback-sequence";
import { pauseWinback, stopWinback } from "@/lib/winback-stop";
import { reopenCase, resumeWinback } from "@/lib/winback-reopen";
import { cancelNurtureAndWinbackTasks } from "@/lib/cancel-sequence-tasks";
import { autoPauseWinbackOnReengagement } from "@/lib/winback-auto-pause";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import type { InboxQueueId } from "@/lib/operational-queue";
import type { PipelineStatus } from "@/lib/lead-pipeline";
import {
  followUpAtFromPreset,
  followUpLabel,
  type FollowUpPreset,
} from "@/lib/follow-up-schedule";
import {
  cancelQualifiedBookingChase,
  enrollQualifiedBookingChase,
} from "@/lib/qualified-booking-chase";
import {
  completeLeadFromInitialInvoice,
  hasInitialInvoiceRecorded,
  reopenLeadToFollowUp,
} from "@/lib/lead-completion";

function sanitizeLeadForWorkspace<
  T extends { passwordHash?: string | null; passwordSalt?: string | null },
>(lead: T) {
  const { passwordHash: _hash, passwordSalt: _salt, ...rest } = lead;
  return {
    ...rest,
    credentialsProvisioned: Boolean(_hash),
  };
}

async function leadDetailPayload(id: string) {
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      caseDocuments: true,
    },
  });
  return lead ? sanitizeLeadForWorkspace(lead) : null;
}

const VALID_QUEUES: InboxQueueId[] = [
  "NEW_LEAD",
  "AWAITING_CALLBACK",
  "AWAITING_DOCUMENTS",
  "APPLICATION",
  "COMPLETION",
  "AT_RISK",
];

const VALID_STATUSES: PipelineStatus[] = [
  "NEW",
  "CONTACTED",
  "BOOKED",
  "WON",
  "LOST",
  "DISQUALIFIED",
  "FOLLOW_UP",
];

async function markLeadLost(
  previous: Lead,
  lostReason: string,
  startWinback?: boolean,
) {
  await cancelNurtureAndWinbackTasks(previous.id);

  const updated = await transitionCaseStage(
    previous,
    "LOST",
    `Case marked as lost — ${lostReason}.`,
    {
      status: "LOST",
      lostReason,
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
      nurtureEnrolled: false,
    },
  );

  if (startWinback && canEnrollWinback(lostReason)) {
    return enrollWinback(updated);
  }

  return updated;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      caseDocuments: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(sanitizeLeadForWorkspace(lead));
}

function coerceMoneyField(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const initialInvoiceAmount = coerceMoneyField(body.initialInvoiceAmount);
  const revenueGenerated = coerceMoneyField(body.revenueGenerated);
  if (initialInvoiceAmount !== undefined) body.initialInvoiceAmount = initialInvoiceAmount;
  if (revenueGenerated !== undefined) body.revenueGenerated = revenueGenerated;

  const previous = await db.lead.findUnique({ where: { id } });

  if (!previous) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (body.resetCredentials === true) {
    if (!isNeuronourish()) {
      return NextResponse.json({ error: "Credential reset is not available for this vertical." }, { status: 400 });
    }

    await db.lead.update({
      where: { id },
      data: {
        passwordHash: null,
        passwordSalt: null,
        funnelStage: "assessment_purchased",
      },
    });

    await db.note.create({
      data: {
        leadId: id,
        author: "Clinical Systems",
        content:
          "Portal authentication credentials erased via care-team administrative override. System re-onboarding forced.",
      },
    });

    await logCaseTimeline(
      id,
      "FORM_SUBMITTED",
      "Portal credentials reset by clinical team — patient must re-complete /onboarding Step 1.",
      "System",
    );

    const full = await leadDetailPayload(id);
    return NextResponse.json(full ?? { success: true, message: "Portal security fields reset complete." });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (body.operationalQueue && !VALID_QUEUES.includes(body.operationalQueue)) {
    return NextResponse.json({ error: "Invalid queue" }, { status: 400 });
  }

  if (body.markContacted) {
    const preset = body.followUpPreset as FollowUpPreset | undefined;
    const followUpAt = body.followUpAt
      ? new Date(body.followUpAt)
      : followUpAtFromPreset(preset ?? "1d");
    const label = followUpLabel(preset, followUpAt);

    const updated = await transitionCaseStage(
      previous,
      "CONTACTED",
      `Daniel marked ${previous.firstName} as contacted — follow up ${label}.`,
      {
        status: "CONTACTED",
        conversationStarted: true,
        lastContactedAt: new Date(),
        firstResponseAt: previous.firstResponseAt ?? new Date(),
        operationalQueue: "AWAITING_CALLBACK",
        nextAction: `Follow up — ${label}`,
        nextActionAt: followUpAt,
        callbackDueAt: null,
        noAnswerCount: 0,
      },
    );
    await cancelQualifiedBookingChase(previous.id);
    if (previous.winbackStatus === "active") {
      return NextResponse.json(await autoPauseWinbackOnReengagement(updated, "marked_contacted"));
    }
    return NextResponse.json(updated);
  }

  if (body.rescheduleFollowUp) {
    const preset = body.followUpPreset as FollowUpPreset | undefined;
    const followUpAt = body.followUpAt
      ? new Date(body.followUpAt)
      : followUpAtFromPreset(preset ?? "1d");
    const label = followUpLabel(preset, followUpAt);

    const updated = await transitionCaseStage(
      previous,
      "CONTACTED",
      `Follow-up rescheduled — ${label}.`,
      {
        operationalQueue: "AWAITING_CALLBACK",
        nextAction: `Follow up — ${label}`,
        nextActionAt: followUpAt,
        callbackDueAt: null,
      },
    );
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.reopenToFollowUp) {
    const preset = body.followUpPreset as FollowUpPreset | undefined;
    const followUpAt = body.followUpAt
      ? new Date(body.followUpAt)
      : followUpAtFromPreset(preset ?? "1d");
    const label = followUpLabel(preset, followUpAt);
    const updated = await reopenLeadToFollowUp(previous, followUpAt, label);
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (
    typeof body.initialInvoiceAmount === "number" &&
    body.initialInvoiceAmount > 0 &&
    !hasInitialInvoiceRecorded(previous)
  ) {
    const updated = await completeLeadFromInitialInvoice(
      previous,
      body.initialInvoiceAmount,
      typeof body.revenueGenerated === "number" ? body.revenueGenerated : previous.revenueGenerated,
    );
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.startBookingChase) {
    try {
      const updated = await enrollQualifiedBookingChase(previous);
      const full = await leadDetailPayload(updated.id);
      return NextResponse.json(full ?? updated);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not start booking chase" },
        { status: 400 },
      );
    }
  }

  if (body.markSaleCompleted) {
    const now = new Date();
    const updated = await transitionCaseStage(
      previous,
      "COMPLETED",
      `Sale completed — commitment fee received for ${previous.firstName}.`,
      {
        operationalQueue: "COMPLETION",
        status: "WON",
        probability: 100,
        expectedValue: previous.estimatedCommission ?? 0,
        remindersPaused: true,
        saleCompletedAt: now,
        initialInvoiceAmount:
          typeof body.initialInvoiceAmount === "number"
            ? body.initialInvoiceAmount
            : previous.initialInvoiceAmount,
        revenueGenerated:
          typeof body.revenueGenerated === "number"
            ? body.revenueGenerated
            : previous.revenueGenerated,
      },
    );
    await cancelQualifiedBookingChase(previous.id);
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.markLost && body.lostReason) {
    if (!LOST_REASONS.includes(body.lostReason)) {
      return NextResponse.json({ error: "Invalid lost reason" }, { status: 400 });
    }
    const updated = await markLeadLost(
      previous,
      body.lostReason,
      body.startWinback === true,
    );
    return NextResponse.json(updated);
  }

  if (body.markDisqualified && body.disqualifiedReason) {
    if (!DISQUALIFIED_REASONS.includes(body.disqualifiedReason)) {
      return NextResponse.json({ error: "Invalid disqualified reason" }, { status: 400 });
    }
    if (previous.winbackStatus === "active" || previous.winbackStatus === "paused") {
      await stopWinback(previous, "disqualified");
    }
    const updated = await transitionCaseStage(
      previous,
      "DISQUALIFIED",
      `Case disqualified — ${body.disqualifiedReason}.`,
      {
        status: "DISQUALIFIED",
        disqualifiedReason: body.disqualifiedReason,
        remindersPaused: true,
        probability: 0,
        expectedValue: 0,
      },
    );
    return NextResponse.json(updated);
  }

  if (body.status === "LOST" && previous.status !== "LOST") {
    const lostReason =
      typeof body.lostReason === "string" && LOST_REASONS.includes(body.lostReason)
        ? body.lostReason
        : "No response";
    const updated = await markLeadLost(
      previous,
      lostReason,
      body.startWinback === true,
    );
    return NextResponse.json(updated);
  }

  if (body.status === "DISQUALIFIED" && previous.status !== "DISQUALIFIED") {
    const disqualifiedReason =
      typeof body.disqualifiedReason === "string" &&
      DISQUALIFIED_REASONS.includes(body.disqualifiedReason)
        ? body.disqualifiedReason
        : "Outside business/investment criteria";
    if (previous.winbackStatus === "active" || previous.winbackStatus === "paused") {
      await stopWinback(previous, "disqualified");
    }
    const updated = await transitionCaseStage(
      previous,
      "DISQUALIFIED",
      `Case disqualified — ${disqualifiedReason}.`,
      {
        status: "DISQUALIFIED",
        disqualifiedReason,
        remindersPaused: true,
        probability: 0,
        expectedValue: 0,
      },
    );
    return NextResponse.json(updated);
  }

  if (body.reopenCase) {
    try {
      const updated = await reopenCase(previous);
      const full = await leadDetailPayload(updated.id);
      return NextResponse.json(full ?? updated);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not re-open case" },
        { status: 400 },
      );
    }
  }

  if (body.enrollWinback) {
    try {
      const updated = await enrollWinback(previous);
      const full = await leadDetailPayload(updated.id);
      return NextResponse.json(full ?? updated);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not enroll win-back" },
        { status: 400 },
      );
    }
  }

  if (body.pauseWinback) {
    const updated = await pauseWinback(previous);
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.resumeWinback) {
    const updated = await resumeWinback(previous);
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.stopWinback) {
    const updated = await stopWinback(previous, "manual");
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  if (body.consultationCompleted) {
    const updated = await transitionCaseStage(
      previous,
      "CONSULTATION_COMPLETED",
      `Consultation with ${previous.firstName} completed.`,
      { consultationCompletedAt: new Date() },
    );
    if (isNeuronourish()) {
      void enrollPostDiscoveryNurtureIfEligible(updated);
    }
    return NextResponse.json(updated);
  }

  if (body.consultationNoShow) {
    const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (isNeuronourish()) {
      const noShowPatch = nnOperationalPatchForStage("discovery_no_show");
      const updated = await db.lead.update({
        where: { id },
        data: {
          ...noShowPatch,
          caseStage: "CONTACTED",
          nextAction: "Reschedule discovery call",
          nextActionAt: retryAt,
          operationalQueue: "AWAITING_CALLBACK",
        },
      });
      await logCaseTimeline(
        previous.id,
        "STAGE_CHANGED",
        `Discovery call no-show — ${previous.firstName} to reschedule.`,
        "System",
      );
      void enrollMissedDiscoveryCallNurture(updated);
      const full = await leadDetailPayload(updated.id);
      return NextResponse.json(full ?? updated);
    }
    const updated = await transitionCaseStage(
      previous,
      "CONTACTED",
      `Consultation no-show — ${previous.firstName} to reschedule.`,
      {
        nextAction: "Reschedule consultation",
        nextActionAt: retryAt,
        operationalQueue: "AWAITING_CALLBACK",
      },
    );
    return NextResponse.json(updated);
  }

  if (body.linkedinOutreach && isNeuronourish()) {
    const payload = body.linkedinOutreach as { campaignKey?: string };
    const defaultKey =
      previous.segment === "employer" ? "executive-burnout-stamina" : "executive-burnout-focus";
    const campaignKey = payload.campaignKey?.trim() || defaultKey;
    const result = await enrollLinkedInOutreachTask(previous.id, campaignKey);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    const full = await leadDetailPayload(previous.id);
    return NextResponse.json(full ?? previous);
  }

  if (body.briefingNoShow) {
    const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (isNeuronourish()) {
      const noShowPatch = nnOperationalPatchForStage("b2b_briefing_no_show");
      const updated = await db.lead.update({
        where: { id },
        data: {
          ...noShowPatch,
          caseStage: "CONTACTED",
          status: "CONTACTED",
          nextAction: "Reschedule practice briefing call",
          nextActionAt: retryAt,
          operationalQueue: "AWAITING_CALLBACK",
        },
      });
      await logCaseTimeline(
        previous.id,
        "STAGE_CHANGED",
        `Practice briefing no-show — ${previous.firstName} ${previous.lastName} to reschedule.`,
        "System",
      );
      void enrollMissedB2BBriefingNurture(updated);
      const full = await leadDetailPayload(updated.id);
      return NextResponse.json(full ?? updated);
    }
    return NextResponse.json({ error: "Briefing no-show is NeuroNourish only" }, { status: 400 });
  }

  if (body.markDocumentsReceived) {
    const updated = await transitionCaseStage(
      previous,
      "DOCUMENTS_RECEIVED",
      `Daniel marked all documents received for ${previous.firstName}.`,
      { operationalQueue: "APPLICATION" },
    );
    return NextResponse.json(updated);
  }

  if (body.advanceFunnelStage && isNeuronourish()) {
    const stage = body.advanceFunnelStage as NnFunnelStage;
    if (!NN_FUNNEL_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid funnel stage" }, { status: 400 });
    }
    const patch = nnOperationalPatchForStage(stage);
    const updated = await db.lead.update({
      where: { id },
      data: patch,
    });
    await logCaseTimeline(
      previous.id,
      "STAGE_CHANGED",
      `Funnel advanced — ${funnelStageLabel(stage)}`,
      "System",
    );
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  const ADVANCE_STAGES: CaseStage[] = [
    "APPLICATION_PREPARING",
    "APPLICATION_SUBMITTED",
    "OFFER_RECEIVED",
    "COMPLETION_SCHEDULED",
    "COMPLETED",
  ];
  if (body.advanceStage) {
    const stage = body.advanceStage as CaseStage;
    if (!ADVANCE_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid advance stage" }, { status: 400 });
    }
    const queue =
      stage === "COMPLETED"
        ? "COMPLETION"
        : stage === "COMPLETION_SCHEDULED" || stage === "OFFER_RECEIVED"
          ? "COMPLETION"
          : "APPLICATION";
    const status = stage === "COMPLETED" ? "WON" : previous.status;
    const updated = await transitionCaseStage(
      previous,
      stage,
      `Case advanced to ${stage.replace(/_/g, " ").toLowerCase()}.`,
      {
        operationalQueue: queue,
        status,
        ...(stage === "COMPLETED"
          ? {
              probability: 100,
              expectedValue: previous.estimatedCommission ?? 0,
              remindersPaused: true,
            }
          : {}),
      },
    );
    const full = await leadDetailPayload(updated.id);
    return NextResponse.json(full ?? updated);
  }

  const lead = await db.lead.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      owner: body.owner ?? undefined,
      operationalQueue: body.operationalQueue ?? undefined,
      nextAction: body.nextAction ?? undefined,
      nextActionAt: body.nextActionAt ? new Date(body.nextActionAt) : undefined,
      estimatedCommission: body.estimatedCommission ?? undefined,
      initialInvoiceAmount: body.initialInvoiceAmount ?? undefined,
      revenueGenerated: body.revenueGenerated ?? undefined,
      lastContactedAt: body.lastContactedAt
        ? new Date(body.lastContactedAt)
        : body.markContacted
          ? new Date()
          : undefined,
    },
  });

  if (body.status && body.status !== previous.status) {
    await db.activity.create({
      data: {
        leadId: id,
        type: "STATUS_CHANGED",
        description: `Moved from ${previous.status} to ${body.status}`,
        metadata: JSON.stringify({
          from: previous.status,
          to: body.status,
        }),
      },
    });

    if (body.status === "FOLLOW_UP" && !previous.nurtureEnrolled) {
      await enrollLongTimeframeNurture(lead);
      await db.lead.update({
        where: { id },
        data: { nurtureEnrolled: true },
      });
    }

    await runAutomations(AutomationTrigger.STATUS_CHANGED, lead, {
      previousStatus: previous.status,
    });
  }

  const updated = await db.lead.findUnique({ where: { id } });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;

  try {
    await deleteLeadCase(id);
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    if (error instanceof Error && error.message === "Lead not found") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }
}
