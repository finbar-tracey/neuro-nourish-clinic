import type { BrandedEmailOptions } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import {
  ensureQuizPartialDropOffNurture,
  enrollPostDiscoveryNurtureIfEligible,
  parseNurtureKeyFromTaskTitle,
  shouldEnrollPostDiscoveryNurture,
  shouldSkipClinicianBriefingFollowup,
  shouldSkipEmployerBriefingFollowup,
  shouldSkipMissedDiscoveryCallNurture,
  shouldSkipMissedB2BBriefingNurture,
  shouldSkipBloodSugarNewsletter,
  shouldSkipGutBrainNewsletter,
  shouldSkipOnboardingWelcome,
  shouldSkipProgrammeNurture,
} from "@/lib/neuronourish-nurture";

const PURCHASED_TIERS = new Set(["assessment_purchased", "assessment_completed", "programme_enrolled"]);

const BOOKED_STATUSES = new Set(["BOOKED", "WON"]);

const QUIZ_PROGRESSION_STAGES = new Set([
  "quiz_completed",
  "assessment_offered",
  "assessment_purchased",
  "assessment_completed",
  "programme_offered",
  "programme_enrolled",
  "discovery_requested",
]);

function shouldSkipNurture(lead: {
  status: string;
  qualificationTier: string | null;
}) {
  if (BOOKED_STATUSES.has(lead.status)) return true;
  if (lead.qualificationTier && PURCHASED_TIERS.has(lead.qualificationTier)) {
    return true;
  }
  return false;
}

function shouldSkipQuizAbandon(lead: { funnelStage: string | null }) {
  const stage = lead.funnelStage ?? "";
  if (stage !== "quiz_partial") return true;
  if (QUIZ_PROGRESSION_STAGES.has(stage)) return true;
  return false;
}

function nurtureHtmlOptions(body: string): BrandedEmailOptions | undefined {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    const label = lines[i]?.trim() ?? "";
    const href = lines[i + 1]?.trim() ?? "";
    if (
      href.startsWith("http") &&
      label.length > 0 &&
      label.length < 80 &&
      !label.includes("http")
    ) {
      return { cta: { label, href }, showDanielSignature: false };
    }
  }
  return undefined;
}

/** Send scheduled NeuroNourish nurture emails (quiz, assessment, EOI sequences). */
export async function processDueNeuronourishNurtureEmails() {
  await ensureQuizPartialDropOffNurture();

  const dueTasks = await db.task.findMany({
    where: {
      completed: false,
      dueDate: { lte: new Date() },
      title: { startsWith: "NN nurture" },
    },
    take: 30,
  });

  let sent = 0;

  for (const task of dueTasks) {
    const lead = await db.lead.findUnique({ where: { id: task.leadId } });
    if (!lead?.email) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (shouldSkipNurture(lead) || isEmailOptedOut(lead.additionalInfo)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    const nurtureKey = parseNurtureKeyFromTaskTitle(task.title);
    if (nurtureKey === "quiz_abandon" && shouldSkipQuizAbandon(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (nurtureKey === "discovery_post_call" && !shouldEnrollPostDiscoveryNurture(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (
      nurtureKey === "clinician_briefing_followup" &&
      shouldSkipClinicianBriefingFollowup(lead)
    ) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (
      nurtureKey === "employer_briefing_followup" &&
      shouldSkipEmployerBriefingFollowup(lead)
    ) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (
      nurtureKey === "missed_discovery_call" &&
      shouldSkipMissedDiscoveryCallNurture(lead)
    ) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (
      nurtureKey === "missed_b2b_briefing_call" &&
      shouldSkipMissedB2BBriefingNurture(lead)
    ) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (
      nurtureKey === "blood_sugar_newsletter" &&
      shouldSkipBloodSugarNewsletter(lead)
    ) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (nurtureKey === "gut_brain_newsletter" && shouldSkipGutBrainNewsletter(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (nurtureKey === "programme_nurture" && shouldSkipProgrammeNurture(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (nurtureKey === "onboarding_welcome" && shouldSkipOnboardingWelcome(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    const subject = task.title.replace(/^NN nurture \[[^\]]+\]:\s*/, "");
    const body = task.description ?? "";

    const result = await sendEmail({
      to: lead.email,
      subject,
      body,
      category: "marketing",
      htmlOptions: nurtureHtmlOptions(body),
    });

    await db.task.update({ where: { id: task.id }, data: { completed: true } });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL_SENT",
        description: result.sent
          ? `NeuroNourish nurture sent: ${subject}`
          : `NeuroNourish nurture logged: ${subject}`,
        metadata: JSON.stringify({
          sequence: "neuronourish_nurture",
          nurtureKey,
          taskId: task.id,
          sent: result.sent,
          resendId: result.id,
        }),
      },
    });

    if (result.sent) sent++;
  }

  return { processed: dueTasks.length, sent };
}
