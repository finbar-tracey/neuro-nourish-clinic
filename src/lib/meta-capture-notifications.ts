import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { signCompletionToken } from "@/lib/completion-link";
import { borrowerCompleteUrl } from "@/lib/sms-links";
import { metaCompleteLinkSmsBody, smsActivityDescription } from "@/lib/sms-copy";
import { sendBrokerMetaAwaitingAlert } from "@/lib/broker-notifications";
import { sendSms } from "@/lib/sms";
import { scheduleMetaCompleteChase } from "@/lib/meta-complete-chase";

function completionUrlForLead(lead: Lead): string | null {
  const token = signCompletionToken(lead.id);
  if (!token) return null;
  return borrowerCompleteUrl(lead.id, token);
}

export async function sendMetaCompleteLinkSms(lead: Lead, completeUrl: string) {
  const body = metaCompleteLinkSmsBody(lead, completeUrl);
  const result = await sendSms(lead.phone, body, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "meta-complete-link",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Meta complete-link SMS", result),
      metadata: JSON.stringify({
        to: lead.phone,
        body,
        sent: result.sent,
        messageUuid: result.id,
        error: result.error,
      }),
    },
  });

  return result;
}

/** Meta instant form ingest — borrower SMS/email + Daniel soft alert (no call-now). */
export async function sendMetaIngestNotifications(lead: Lead) {
  const completeUrl = completionUrlForLead(lead);
  if (!completeUrl) {
    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "AUTOMATION_RUN",
        description: "Meta ingest skipped — COMPLETION_LINK_SECRET not configured",
      },
    });
    return { completeUrl: null as string | null, smsSent: false, brokerSent: false };
  }

  const [sms, brokerSms] = await Promise.all([
    sendMetaCompleteLinkSms(lead, completeUrl),
    sendBrokerMetaAwaitingAlert(lead),
  ]);

  await sendJourneyEmail(lead, "meta-capture-welcome", { completeUrl });
  await scheduleMetaCompleteChase(lead.id, completeUrl);

  return {
    completeUrl,
    smsSent: sms.sent,
    smsError: sms.error,
    brokerSent: brokerSms.sent,
    brokerError: brokerSms.error,
  };
}
