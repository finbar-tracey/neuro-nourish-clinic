import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { purposeLabel } from "@/lib/operational-queue";
import {
  bookingReminderSmsBody,
  brokerHotLeadSmsBody,
  brokerMetaAwaitingSmsBody,
  brokerNewLeadSmsBody,
  brokerWarmLeadSmsBody,
  noBookingFollowUpSmsBody,
  smsActivityDescription,
} from "@/lib/sms-copy";
import { brokerNotifyPhone } from "@/lib/broker-notify";
import { sendSms } from "@/lib/sms";
import { getSiteUrl } from "@/lib/site-url";
import { timeframeShortLabel } from "@/lib/timeframes";
import { isMetaInstantFormSource } from "@/lib/meta-source";

function brokerCaseUrl(leadId: string) {
  return `${getSiteUrl()}/workspace/cases/${leadId}`;
}

export async function sendBrokerNewLeadAlert(lead: Lead) {
  const body = brokerNewLeadSmsBody(lead, purposeLabel(lead.loanPurpose));

  const brokerPhone = brokerNotifyPhone();
  const result = await sendSms(brokerPhone, body, {
    audience: "broker",
    leadId: lead.id,
    purpose: "broker-new-lead",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Broker new-lead SMS", result, { borrower: false }),
      metadata: JSON.stringify({
        to: brokerPhone,
        sent: result.sent,
        messageUuid: result.id,
        error: result.error,
      }),
    },
  });

  return result;
}

export async function sendBrokerMetaAwaitingAlert(lead: Lead) {
  const purpose = purposeLabel(lead.loanPurpose);
  const timeline = timeframeShortLabel(lead.timeframe);
  const body = brokerMetaAwaitingSmsBody(lead, purpose, timeline, brokerCaseUrl(lead.id));

  const brokerPhone = brokerNotifyPhone();
  const result = await sendSms(brokerPhone, body, {
    audience: "broker",
    leadId: lead.id,
    purpose: "broker-meta-awaiting",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Broker Meta awaiting SMS", result, { borrower: false }),
      metadata: JSON.stringify({
        to: brokerPhone,
        sent: result.sent,
        messageUuid: result.id,
        error: result.error,
      }),
    },
  });

  return result;
}

/** HOT/WARM tier SMS after Meta instant form step 3 qualified (not researching). */
export async function sendBrokerMetaQualifiedTierAlert(lead: Lead) {
  if (!isMetaInstantFormSource(lead.source)) return { sent: false, skipped: true as const };

  const purpose = purposeLabel(lead.loanPurpose);
  const body =
    lead.timeframe === "urgent"
      ? brokerHotLeadSmsBody(lead, purpose)
      : brokerWarmLeadSmsBody(lead, purpose);

  const brokerPhone = brokerNotifyPhone();
  const result = await sendSms(brokerPhone, body, {
    audience: "broker",
    leadId: lead.id,
    purpose: lead.timeframe === "urgent" ? "broker-meta-hot" : "broker-meta-warm",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription(
        lead.timeframe === "urgent" ? "Broker HOT Meta SMS" : "Broker WARM Meta SMS",
        result,
        { borrower: false },
      ),
      metadata: JSON.stringify({
        to: brokerPhone,
        sent: result.sent,
        messageUuid: result.id,
        error: result.error,
      }),
    },
  });

  return result;
}

export async function sendNoBookingFollowUpSms(lead: Lead) {
  const body = noBookingFollowUpSmsBody(lead);

  const result = await sendSms(lead.phone, body, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "no-booking-follow-up",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: result.sent
        ? "No-booking follow-up SMS sent"
        : "No-booking follow-up SMS logged",
      metadata: JSON.stringify({ sent: result.sent, error: result.error }),
    },
  });

  return result;
}

export async function sendBookingReminderSms(lead: Lead, displayTime: string) {
  const body = bookingReminderSmsBody(lead, displayTime);

  const result = await sendSms(lead.phone, body, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "booking-reminder",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: result.sent
        ? `Booking reminder SMS sent (${displayTime})`
        : "Booking reminder SMS logged",
      metadata: JSON.stringify({ displayTime, sent: result.sent }),
    },
  });

  return result;
}
