import type { Lead } from "@/generated/prisma/client";
import { brokerNotifyEmail } from "@/lib/broker-notify";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { captureSmsBody, smsActivityDescription } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";

export async function sendCaptureSms(lead: Lead) {
  const body = captureSmsBody(lead);
  const result = await sendSms(lead.phone, body, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "capture",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Capture SMS", result),
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

/** Branded journey emails with working CTAs (replaces legacy plain automation emails). */
export async function sendCaptureJourneyEmails(lead: Lead) {
  await sendJourneyEmail(lead, "capture-welcome");
  await sendJourneyEmail(lead, "broker-capture-alert", undefined, {
    skipDedup: true,
    to: brokerNotifyEmail(),
  });
}
