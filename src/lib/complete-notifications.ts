import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { qualifiedConfirmationSmsBody, smsActivityDescription } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";

export async function sendQualifiedConfirmationSms(lead: Lead) {
  const body = qualifiedConfirmationSmsBody(lead);
  const result = await sendSms(lead.phone, body, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "qualified-confirmation",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Qualified confirmation SMS", result),
      metadata: JSON.stringify({
        to: lead.phone,
        body,
        sent: result.sent,
        messageUuid: result.id,
        error: result.error,
      }),
    },
  });
}

export async function sendQualifiedConfirmationEmail(lead: Lead) {
  await sendJourneyEmail(lead, "qualified-confirmation");
}

export async function sendQualifiedConfirmation(lead: Lead) {
  await sendQualifiedConfirmationSms(lead);
  await sendQualifiedConfirmationEmail(lead);
}
