import { NextResponse } from "next/server";
import { AutomationTrigger } from "@/generated/prisma/client";
import { runAutomations, seedDefaultAutomations, ensureCaptureAutomationRules } from "@/lib/automations";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { resolveAttributionChannel } from "@/lib/attribution";
import { resolveCampaignSource, type TrackingParams } from "@/lib/tracking";
import { qualifiedOperationalFields } from "@/lib/operational-queue";
import { sendMetaCapiEvent, type MetaCapiInput } from "@/lib/meta-capi";
import { clientIp } from "@/lib/rate-limit";
import { emailConfigured } from "@/lib/email";
import { smsConfigured } from "@/lib/sms";
import { defaultCaseOwner, partnerDisplayName } from "@/lib/vertical-config";
import { funnelLeadSchema, waitlistLeadSchema } from "@/lib/validations";
import { autoPauseWinbackForEmail } from "@/lib/winback-auto-pause";
import { normalizePhone } from "@/lib/phone-ie";
import type { NnFunnelStage } from "@/lib/neuronourish-funnel";
import { funnelStageLabel, normalizeClinicalSegment } from "@/lib/neuronourish-funnel";
import { cancelSequenceTasksByPrefix } from "@/lib/cancel-sequence-tasks";
import {
  cancelClinicianBriefingFollowup,
  cancelMissedDiscoveryCallNurture,
  cancelMissedB2BBriefingNurture,
  cancelBloodSugarNewsletterSeries,
  cancelEnterpriseBriefingNurture,
  cancelGutBrainNewsletterSeries,
  cancelOnboardingWelcomeNurture,
  enrollBloodSugarNewsletterSeries,
  enrollGutBrainNewsletterSeries,
  enrollClinicianBriefingFollowup,
  enrollEnterpriseBriefingNurture,
  enrollNeuronourishNurture,
  sendBriefingPackDeliveryEmail,
  sendEmployerWellnessAutoResponse,
  sendNeuronourishInstantEmail,
} from "@/lib/neuronourish-nurture";
import { siteUrl } from "@/lib/site-url";
import {
  sendClinicianBriefingAlert,
  clinicianBriefingPayloadFromLead,
  sendNeuronourishPartnerAlert,
} from "@/lib/neuronourish-notifications";
import {
  nnCallbackDueAt,
  nnLegacyLoanStub,
  nnOperationalPatchForStage,
  pipelineValueEurForStage,
  qualificationTierFromQuiz,
  workspaceClientLabel,
} from "@/lib/neuronourish-workspace";
import { isNeuronourish } from "@/lib/vertical-config";

type TrackingInput = {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  landingPageUrl?: string;
  referrer?: string;
  deviceType?: string;
  adAngle?: string;
  metaEventId?: string;
  fbp?: string;
  fbc?: string;
};

function leadTrackingFields(tracking: TrackingInput, source: string) {
  const campaignSource = resolveCampaignSource(tracking as TrackingParams, tracking.source ?? source);
  return {
    source: campaignSource ?? source,
    utmSource: tracking.utmSource,
    utmMedium: tracking.utmMedium,
    utmCampaign: tracking.utmCampaign,
    utmContent: tracking.utmContent,
    utmTerm: tracking.utmTerm,
    fbclid: tracking.fbclid,
    gclid: tracking.gclid,
    landingPageUrl: tracking.landingPageUrl,
    referrer: tracking.referrer,
    deviceType: tracking.deviceType,
  };
}

function isClinicianPartnershipLead(data: {
  segment?: string | null;
  primaryConcern?: string | null;
  source?: string;
}) {
  if (data.primaryConcern === "employer_oh") return false;
  return (
    data.segment === "clinician" ||
    data.source === "clinics_partnership" ||
    data.primaryConcern === "healthcare_partnership" ||
    Boolean(data.primaryConcern?.endsWith("_practice") || data.primaryConcern?.endsWith("_clinic"))
  );
}

function isEmployerWellnessInquiry(data: {
  segment?: string | null;
  primaryConcern?: string | null;
  message?: string | null;
  source?: string;
}) {
  if (data.segment === "employer" || data.primaryConcern === "employer_oh") return true;
  if (data.source === "employer_wellness") return true;
  const text = `${data.message ?? ""} ${data.primaryConcern ?? ""}`.toLowerCase();
  const keywords = [
    "corporate",
    "workplace",
    "employee",
    "employees",
    "hr ",
    "human resources",
    "executive burnout",
    "occupational health",
    "population wellness",
    "workforce",
  ];
  return keywords.some((k) => text.includes(k));
}

function notifyClinicianBriefingLead(
  lead: Awaited<ReturnType<typeof upsertLead>>,
  input?: { clinicName?: string; message?: string },
) {
  void sendClinicianBriefingAlert(clinicianBriefingPayloadFromLead(lead, input));
}

function metaCapiContext(
  request: Request,
  tracking: TrackingInput,
  lead: { id: string; email: string; phone: string; firstName: string; lastName: string; fbclid?: string | null },
): MetaCapiInput {
  return {
    email: lead.email,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    leadId: lead.id,
    loanAmount: 0,
    currency: "EUR",
    sourceUrl: tracking.landingPageUrl,
    fbclid: tracking.fbclid ?? lead.fbclid ?? undefined,
    eventId: tracking.metaEventId,
    fbp: tracking.fbp,
    fbc: tracking.fbc,
    clientIp: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

function baseLeadPayload(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    primaryConcern?: string;
    funnelStage: string;
    additionalInfo?: string;
    quizScore?: number;
    segment?: string;
  },
  tracking: TrackingInput,
  source: string,
) {
  const stage = data.funnelStage as NnFunnelStage;
  const concern = data.primaryConcern ?? null;
  const segment =
    data.quizScore != null
      ? normalizeClinicalSegment(data.quizScore, data.segment)
      : data.segment ?? null;
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    ...nnLegacyLoanStub(concern),
    hasExistingMortgage: false,
    willOccupy: false,
    hasEverOccupied: false,
    formCompleted: stage === "quiz_completed" || stage === "eoi_submitted",
    funnelStage: stage,
    quizScore: data.quizScore ?? null,
    primaryConcern: concern,
    segment,
    qualificationTier:
      data.quizScore != null ? qualificationTierFromQuiz(data.quizScore, segment ?? undefined) : "unscreened",
    pipelineValueEur: pipelineValueEurForStage(stage),
    additionalInfo: data.additionalInfo ?? `[NeuroNourish] ${funnelStageLabel(stage)}`,
    status: "NEW" as const,
    ...leadTrackingFields(tracking, source),
    attributionChannel: resolveAttributionChannel({
      source: tracking.source ?? source,
      utmSource: tracking.utmSource,
      utmMedium: tracking.utmMedium,
      fbclid: tracking.fbclid,
      gclid: tracking.gclid,
    }),
    ...qualifiedOperationalFields(),
    owner: defaultCaseOwner(),
  };
}

async function findByEmail(email: string) {
  const store = await db.lead.findMany();
  return store.find((l) => l.email.toLowerCase() === email.toLowerCase());
}

async function upsertLead(
  data: Parameters<typeof baseLeadPayload>[0],
  tracking: TrackingInput,
  source: string,
  leadId?: string,
) {
  const payload = baseLeadPayload(data, tracking, source);
  const nnPatch = isNeuronourish()
    ? nnOperationalPatchForStage(data.funnelStage as NnFunnelStage)
    : {};
  const merged = { ...payload, ...nnPatch };
  if (leadId) {
    const existing = await db.lead.findUnique({ where: { id: leadId } });
    if (existing) {
      return db.lead.update({ where: { id: leadId }, data: merged });
    }
  }
  const byEmail = await findByEmail(data.email);
  if (byEmail) {
    return db.lead.update({ where: { id: byEmail.id }, data: merged });
  }
  const lead = await db.lead.create({ data: merged });
  await logCaseTimeline(lead.id, "LEAD_CREATED", `Case created — assigned to ${partnerDisplayName()}.`, "System");
  await runAutomations(AutomationTrigger.LEAD_CREATED, lead);
  return lead;
}

export async function handleFunnelPost(request: Request, body: unknown) {
  const funnelParsed = funnelLeadSchema.safeParse(body);
  if (!funnelParsed.success) {
    // If this looks like a funnel event, return field errors instead of falling through
    const stage =
      body && typeof body === "object" && "funnelStage" in body
        ? String((body as { funnelStage?: unknown }).funnelStage ?? "")
        : "";
    if (stage.startsWith("quiz_") || stage === "quiz_started") {
      const errors: Record<string, string> = {};
      funnelParsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? "form";
        errors[key] = issue.message;
      });
      return NextResponse.json({ error: "Invalid quiz submission", errors }, { status: 400 });
    }
  }
  if (funnelParsed.success) {
    const data = funnelParsed.data;
    const tracking = data as TrackingInput;
    await seedDefaultAutomations();
    await ensureCaptureAutomationRules();

    if (data.funnelStage === "quiz_started") {
      const eventId = tracking.metaEventId ?? `quiz-start-${Date.now()}`;
      void sendMetaCapiEvent("ViewContent", {
        eventId,
        contentName: "Brain Health Quiz",
        contentType: "product",
        currency: "EUR",
        loanAmount: 0,
        sourceUrl: tracking.landingPageUrl,
        fbclid: tracking.fbclid,
        fbp: tracking.fbp,
        fbc: tracking.fbc,
        clientIp: clientIp(request),
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return NextResponse.json({ ok: true, eventId });
    }

    if (data.funnelStage === "quiz_partial") {
      const phone = data.phone ? normalizePhone(data.phone) : "";
      const lead = await upsertLead(
        {
          firstName: data.firstName,
          lastName: data.lastName?.trim() || "",
          email: data.email,
          phone,
          funnelStage: "quiz_partial",
          additionalInfo: `[NeuroNourish] Quiz soft capture at Q${data.quizProgress ?? "?"} (name + email)`,
        },
        tracking,
        "quiz",
        data.leadId,
      );
      await logCaseTimeline(lead.id, "FORM_SUBMITTED", "Quiz contact captured", workspaceClientLabel());
      void enrollNeuronourishNurture(lead, "quiz_abandon");
      // Soft-capture Lead for Meta retargeting (email + browser IDs). No partner SMS mid-quiz.
      void sendMetaCapiEvent("Lead", {
        ...metaCapiContext(request, tracking, lead),
        eventId: tracking.metaEventId ?? `quiz-partial-${lead.id}`,
        contentName: "Brain Health Quiz Soft Capture",
      });
      return NextResponse.json({ ok: true, leadId: lead.id });
    }

    if (data.funnelStage === "quiz_report_request") {
      const existing = await db.lead.findUnique({ where: { id: data.leadId } });
      if (!existing) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      const rawPhone = data.phone?.trim() ?? "";
      if (rawPhone && data.consent !== true) {
        return NextResponse.json(
          { error: "Consent required when sharing a mobile number" },
          { status: 400 },
        );
      }
      const phone = rawPhone ? normalizePhone(rawPhone) : existing.phone;
      const hasNewPhone = Boolean(rawPhone);
      const due = hasNewPhone ? nnCallbackDueAt() : undefined;
      const lead = await db.lead.update({
        where: { id: data.leadId },
        data: {
          phone,
          ...(hasNewPhone
            ? {
                nextAction: "Call client — quiz report requested",
                nextActionAt: due,
                callbackDueAt: due,
                caseStage: "CONTACTED",
              }
            : {}),
          additionalInfo: `${existing.additionalInfo ?? ""}\n[NeuroNourish] Quiz report requested${
            hasNewPhone ? " · mobile captured for follow-up" : " · email only"
          }`.trim(),
        },
      });
      await logCaseTimeline(
        lead.id,
        "FORM_SUBMITTED",
        hasNewPhone
          ? "Quiz report requested — mobile captured for follow-up"
          : "Quiz report requested — email delivery",
        workspaceClientLabel(),
      );
      void sendNeuronourishInstantEmail(
        lead,
        "Your NeuroNourish brain archetype report",
        `Hi ${lead.firstName},\n\nYour personalised brain health report is ready${
          lead.quizScore != null ? ` — your score is ${lead.quizScore}/100` : ""
        }.\n\nView your results again: ${siteUrl()}/quiz/results?leadId=${lead.id}&score=${lead.quizScore ?? ""}\n\nYour next steps:\n1. Watch for your invitation to Emer's Brain Reset Masterclass\n2. When you're ready, take the Cognitive Health Assessment: ${siteUrl()}/assessment?leadId=${lead.id}\n3. Explore the 12-month personalised programme: ${siteUrl()}/programme?leadId=${lead.id}\n\nPrefer to talk first? Book a discovery call (goals and fit — not a live quiz walkthrough): ${siteUrl()}/discovery?leadId=${lead.id}\n\nIn partnership,\nEmer Sexton\nNeuroNourish Clinic`,
      );
      void sendNeuronourishPartnerAlert(lead, {
        sms: hasNewPhone,
        details: hasNewPhone
          ? "HOT — report requested with mobile; call soon"
          : "Report emailed (no mobile) — nurture / offer discovery",
      });
      return NextResponse.json({ ok: true, leadId: lead.id, phoneCaptured: hasNewPhone });
    }

    if (data.funnelStage === "quiz_completed") {
      const existing = await db.lead.findUnique({ where: { id: data.leadId } });
      if (!existing) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      const segment = normalizeClinicalSegment(data.quizScore, data.segment);
      const archetypeLine =
        data.archetypeName || data.archetypeKey
          ? ` · archetype ${data.archetypeName ?? data.archetypeKey}`
          : "";
      const priorInfo = (existing.additionalInfo ?? "").trim();
      const scoreLine = `[NeuroNourish] Quiz score ${data.quizScore}/100 · segment ${segment}${archetypeLine}`;
      const lead = await db.lead.update({
        where: { id: data.leadId },
        data: {
          ...nnOperationalPatchForStage("quiz_completed", {
            quizScore: data.quizScore,
            segment,
            primaryConcern: existing.primaryConcern ?? existing.loanPurpose,
            qualificationTier: qualificationTierFromQuiz(data.quizScore, segment),
          }),
          formCompleted: true,
          additionalInfo: priorInfo.includes(scoreLine)
            ? priorInfo
            : [priorInfo, scoreLine].filter(Boolean).join("\n"),
        },
      });
      await logCaseTimeline(
        lead.id,
        "FORM_SUBMITTED",
        `Brain health quiz completed — score ${data.quizScore}/100${archetypeLine}`,
        workspaceClientLabel(),
      );
      void enrollNeuronourishNurture(lead, "quiz_complete");
      void enrollBloodSugarNewsletterSeries(lead);
      void enrollGutBrainNewsletterSeries(lead);
      console.log(
        `[AUTOMATION ENROLLMENT] Initializing blood sugar and gut-brain educational series for: ${lead.id}`,
      );
      void sendNeuronourishPartnerAlert(lead, {
        details: `Quiz completed — score ${data.quizScore}/100${archetypeLine}`,
      });
      const archetypeName = data.archetypeName?.trim();
      void sendNeuronourishInstantEmail(
        lead,
        archetypeName
          ? `Your brain health results — ${archetypeName}`
          : "Your brain health quiz results are ready",
        `Hi ${lead.firstName},\n\nThank you for completing the quiz${
          archetypeName ? ` — your archetype is ${archetypeName}` : ""
        }${
          data.quizScore != null ? `. Your score is ${data.quizScore}/100` : ""
        }.\n\nView your results and email your full report: ${siteUrl()}/quiz/results?leadId=${lead.id}&score=${data.quizScore}\n\nYour path from here:\n1. Email your report (includes Emer's Brain Reset Masterclass invitation)\n2. Cognitive Health Assessment when you're ready: ${siteUrl()}/assessment?leadId=${lead.id}\n3. 12-month programme: ${siteUrl()}/programme?leadId=${lead.id}\n\nIn partnership,\nEmer Sexton\nNeuroNourish Clinic`,
      );
      if (tracking.metaEventId || tracking.fbclid) {
        void sendMetaCapiEvent("Lead", {
          ...metaCapiContext(request, tracking, lead),
          contentName: "NeuroNourish Quiz Complete",
          eventId: tracking.metaEventId ?? `quiz-${lead.id}`,
        });
      }
      return NextResponse.json({ ok: true, leadId: lead.id, score: data.quizScore, segment });
    }

    const phone = normalizePhone(data.phone);
    const stage = data.funnelStage as NnFunnelStage;
    const trackingSource = (data as TrackingInput & { source?: string }).source;
    const clinicianLead = isClinicianPartnershipLead({
      segment: data.segment,
      primaryConcern: data.primaryConcern,
      source: trackingSource,
    });
    const employerLead = isEmployerWellnessInquiry({
      segment: data.segment,
      primaryConcern: data.primaryConcern,
      message: data.message,
      source: trackingSource,
    });
    const lead = await upsertLead(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone,
        primaryConcern: data.primaryConcern,
        segment: employerLead ? "employer" : clinicianLead ? "clinician" : data.segment,
        funnelStage: stage,
        additionalInfo: data.message
          ? `[NeuroNourish] ${funnelStageLabel(stage)} — ${data.message}`
          : undefined,
      },
      { ...tracking, source: trackingSource ?? tracking.source },
      clinicianLead ? "clinics_partnership" : employerLead ? "employer_wellness" : stage,
      data.leadId,
    );
    await logCaseTimeline(
      lead.id,
      "FORM_SUBMITTED",
      funnelStageLabel(stage),
      workspaceClientLabel(),
    );
    if (stage === "eoi_submitted") {
      if (employerLead) {
        void sendEmployerWellnessAutoResponse(lead);
        void enrollEnterpriseBriefingNurture(lead.id);
        void sendNeuronourishPartnerAlert(lead);
      } else if (clinicianLead) {
        const briefingLead = await db.lead.update({
          where: { id: lead.id },
          data: {
            segment: "clinician",
            ...nnOperationalPatchForStage("clinician_briefing_downloaded"),
          },
        });
        void sendBriefingPackDeliveryEmail(briefingLead);
        void enrollClinicianBriefingFollowup(briefingLead);
        notifyClinicianBriefingLead(briefingLead, {
          clinicName: (data as { clinicName?: string }).clinicName,
          message: data.message,
        });
      } else {
        void enrollNeuronourishNurture(lead, "eoi");
        void sendNeuronourishPartnerAlert(lead);
      }
    }
    if (stage === "discovery_requested") {
      await cancelSequenceTasksByPrefix(lead.id, "NN nurture [quiz_abandon]");
      await cancelClinicianBriefingFollowup(lead.id);
      await cancelEnterpriseBriefingNurture(lead.id);
      await cancelMissedDiscoveryCallNurture(lead.id);
      await cancelMissedB2BBriefingNurture(lead.id);
      await cancelBloodSugarNewsletterSeries(lead.id);
      await cancelGutBrainNewsletterSeries(lead.id);
      await cancelOnboardingWelcomeNurture(lead.id);
      void sendNeuronourishPartnerAlert(lead);
      void sendNeuronourishInstantEmail(
        lead,
        "We've received your discovery call request",
        `Hi ${lead.firstName},\n\nThank you for requesting a complimentary discovery call with NeuroNourish.\n\nOur care team will confirm a 15-minute time by email — usually within one business day.\n\nIf you haven't taken the brain health quiz yet, it helps us prepare: ${siteUrl()}/quiz?leadId=${lead.id}\n\nIn partnership,\nThe NeuroNourish Care Team`,
      );
    }
    await autoPauseWinbackForEmail(lead.email, "new_form", lead.id);
    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      notifications: { email: emailConfigured(), sms: smsConfigured() },
    });
  }

  return handleNeuronourishLeadPost(request, body);
}

export async function handleNeuronourishLeadPost(request: Request, body: unknown) {
  const parsed = waitlistLeadSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const data = parsed.data;
  const tracking: TrackingInput = data;
  const phone = normalizePhone(data.phone);

  await seedDefaultAutomations();
  await ensureCaptureAutomationRules();

  const clinicianLead = isClinicianPartnershipLead({
    segment: data.segment,
    primaryConcern: data.primaryConcern,
    source: data.source,
  });
  const employerLead = isEmployerWellnessInquiry({
    segment: data.segment,
    primaryConcern: data.primaryConcern,
    message: data.message,
    source: data.source,
  });

  const lead = await upsertLead(
    {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone,
      primaryConcern: data.primaryConcern,
      segment: employerLead ? "employer" : clinicianLead ? "clinician" : data.segment,
      funnelStage: "eoi_submitted",
      additionalInfo: `[NeuroNourish] Expression of interest · ${data.primaryConcern}${data.ageRange ? ` · ${data.ageRange}` : ""}${data.message ? ` — ${data.message}` : ""}`,
    },
    tracking,
    clinicianLead ? "clinics_partnership" : employerLead ? "employer_wellness" : "eoi",
    data.leadId,
  );

  await logCaseTimeline(
    lead.id,
    "FORM_SUBMITTED",
    `${data.firstName} ${data.lastName} — expression of interest`,
    workspaceClientLabel(),
  );
  if (employerLead) {
    void sendEmployerWellnessAutoResponse(lead);
    void enrollEnterpriseBriefingNurture(lead.id);
    void sendNeuronourishPartnerAlert(lead);
  } else if (clinicianLead) {
    const briefingLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        segment: "clinician",
        ...nnOperationalPatchForStage("clinician_briefing_downloaded"),
      },
    });
    void sendBriefingPackDeliveryEmail(briefingLead);
    void enrollClinicianBriefingFollowup(briefingLead);
    notifyClinicianBriefingLead(briefingLead, { message: data.message });
  } else {
    void enrollNeuronourishNurture(lead, "eoi");
    void sendNeuronourishPartnerAlert(lead);
  }
  await autoPauseWinbackForEmail(lead.email, "new_form", lead.id);

  if (tracking.metaEventId || tracking.fbclid) {
    void sendMetaCapiEvent("Lead", {
      ...metaCapiContext(request, tracking, lead),
      contentName: "NeuroNourish EOI",
      eventId: tracking.metaEventId ?? `eoi-${lead.id}`,
    });
  }

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    notifications: { email: emailConfigured(), sms: smsConfigured() },
  });
}
