import type { ActivityType, CaseStage, Lead } from "@/generated/prisma/client";
import { brokerNotifyEmail } from "@/lib/broker-notify";
import { db } from "@/lib/db";
import { sendEmail, isMarketingJourneyEmail } from "@/lib/email";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import {
  appendJourneyEmailTag,
  buildJourneyEmail,
  emailContextFromLead,
  hasJourneyEmailBeenSent,
  type EmailContext,
  type JourneyEmailId,
} from "@/lib/journey-emails";

const STAGE_EMAILS: Partial<Record<CaseStage, JourneyEmailId>> = {
  DOCUMENTS_RECEIVED: "documents-received",
  APPLICATION_SUBMITTED: "application-submitted",
  OFFER_RECEIVED: "offer-received",
  COMPLETION_SCHEDULED: "completion-scheduled",
  COMPLETED: "deal-completed",
};

/** Human-readable timeline labels (CRM wiring / broker inbox). */
const EMAIL_ACTIVITY_LABELS: Partial<Record<JourneyEmailId, string>> = {
  "capture-welcome": "Capture welcome email",
  "meta-capture-welcome": "Meta capture welcome email",
  "qualified-confirmation": "Qualified confirmation email",
  "priority-call-confirmed": "Priority call confirmation email",
  "broker-priority-booked": "Broker priority call alert email",
};

function emailActivityDescription(
  id: JourneyEmailId,
  subject: string,
  audience: "borrower" | "broker",
  sent: boolean,
  error?: string,
) {
  const label = EMAIL_ACTIVITY_LABELS[id] ?? `Journey email: ${subject}`;
  const target = audience === "broker" ? "broker" : "lead";
  if (sent) return `${label} sent to ${target}`;
  if (error) return `${label} failed: ${error}`;
  return `${label} logged (Resend not configured or dry-run)`;
}

export async function sendJourneyEmail(
  lead: Lead,
  id: JourneyEmailId,
  extra?: Partial<EmailContext>,
  options?: { skipDedup?: boolean; to?: string },
) {
  if (!options?.skipDedup && hasJourneyEmailBeenSent(lead, id)) {
    return { sent: false, logged: true, skipped: true as const };
  }

  const email = buildJourneyEmail(id, emailContextFromLead(lead, extra));

  if (email.audience === "borrower" && isEmailOptedOut(lead.additionalInfo)) {
    return { sent: false, logged: true, skipped: true as const };
  }

  const to =
    options?.to ?? (email.audience === "broker" ? brokerNotifyEmail() : lead.email);

  const result = await sendEmail({
    to,
    subject: email.subject,
    body: email.body,
    category: isMarketingJourneyEmail(id) ? "marketing" : "transactional",
    htmlOptions: {
      ...email.options,
      stageLabel: email.stage,
      preheader: email.subject,
      showPhoneCta: email.audience === "borrower",
    },
  });

  if (!options?.skipDedup) {
    const current = await db.lead.findUnique({ where: { id: lead.id } });
    await db.lead.update({
      where: { id: lead.id },
      data: {
        additionalInfo: appendJourneyEmailTag(current?.additionalInfo, id),
      },
    });
  }

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "EMAIL_SENT" satisfies ActivityType,
      description: emailActivityDescription(
        id,
        email.subject,
        email.audience,
        result.sent,
        result.error,
      ),
      metadata: JSON.stringify({
        journeyEmailId: id,
        to,
        subject: email.subject,
        sent: result.sent,
        resendId: result.id,
        error: result.error,
      }),
    },
  });

  return result;
}

export async function sendStageJourneyEmail(lead: Lead, stage: CaseStage) {
  const id = STAGE_EMAILS[stage];
  if (!id) return null;
  return sendJourneyEmail(lead, id);
}

export async function maybeSendStageEmail(
  updatedLead: Lead,
  stage: CaseStage,
  previousStage?: CaseStage | null,
) {
  if (previousStage === stage) return;
  return sendStageJourneyEmail(updatedLead, stage);
}
