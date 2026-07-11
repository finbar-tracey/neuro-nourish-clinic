import type { Lead } from "@/generated/prisma/client";
import { brokerNotifyPhone } from "@/lib/broker-notify";
import { sendBookingReminderSms, sendNoBookingFollowUpSms } from "@/lib/broker-notifications";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { brokerCallReminderSmsBody, documentChase24hSmsBody, documentChase48hSmsBody } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";
import { formatDisplayTime, findSlotByLabel } from "@/lib/priority-slots";
import { PRIORITY_CALL_BOOKED_PREFIX } from "@/lib/lead-tags";
import { logCaseTimeline } from "@/lib/case-engine";
import { uploadPageUrl } from "@/lib/case-documents";
import { isNeuronourish } from "@/lib/vertical-config";

const NO_BOOKING_TAG = "[No-booking SMS sent]";
const REMINDER_TAG = "[Booking reminder sent]";
const CONSULTATION_OVERDUE_TAG = "[Consultation overdue]";

function minutesSince(date: Date, now = Date.now()) {
  return (now - date.getTime()) / (60 * 1000);
}

/** Qualified leads with no priority call 15+ mins after completion → nudge SMS */
export async function processNoBookingFollowUps() {
  const leads = await db.lead.findMany();
  let sent = 0;

  for (const lead of leads) {
    if (!lead.formCompleted) continue;
    if (lead.status === "DISQUALIFIED" || lead.status === "LOST") continue;
    if (lead.priorityCallBookedAt || lead.additionalInfo?.includes(PRIORITY_CALL_BOOKED_PREFIX)) {
      continue;
    }
    if (lead.additionalInfo?.includes(NO_BOOKING_TAG)) continue;
    if (minutesSince(lead.updatedAt) < 15) continue;

    await sendNoBookingFollowUpSms(lead);
    const tag = NO_BOOKING_TAG;
    await db.lead.update({
      where: { id: lead.id },
      data: {
        additionalInfo: lead.additionalInfo?.includes(tag)
          ? lead.additionalInfo
          : lead.additionalInfo
            ? `${tag} ${lead.additionalInfo}`
            : tag,
        nextAction: "Follow up — no priority call booked",
      },
    });
    sent++;
  }

  return { sent };
}

/** Priority calls starting in ~55–65 minutes → reminder SMS + email to borrower, SMS to Daniel */
export async function processBookingReminders() {
  const leads = await db.lead.findMany();
  let sent = 0;
  const brokerPhone = brokerNotifyPhone();

  for (const lead of leads) {
    if (!lead.priorityCallSlot || !lead.priorityCallBookedAt) continue;
    if (lead.additionalInfo?.includes(REMINDER_TAG)) continue;

    const slot = findSlotByLabel(lead.priorityCallSlot);
    if (!slot) continue;

    const displayTime = formatDisplayTime(slot);
    const slotMinsFromMidnight = slot.minutes;
    const londonNow = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(londonNow.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(londonNow.find((p) => p.type === "minute")?.value ?? 0);
    const currentMins = hour * 60 + minute;
    const minsUntil = slotMinsFromMidnight - currentMins;

    if (minsUntil < 50 || minsUntil > 70) continue;
    if (minutesSince(lead.priorityCallBookedAt) < 5) continue;

    const borrowerSms = await sendBookingReminderSms(lead, displayTime);
    const borrowerEmail = await sendJourneyEmail(lead, "booking-reminder", {
      displayTime,
      teamsLink: lead.teamsMeetingUrl,
    });
    const brokerSms = await sendSms(
      brokerPhone,
      brokerCallReminderSmsBody(lead.firstName, lead.lastName, displayTime),
      { audience: "broker", leadId: lead.id, purpose: "broker-call-reminder" },
    );

    await logCaseTimeline(
      lead.id,
      "AUTOMATION_RUN",
      `1-hour call reminder sent for ${displayTime}.`,
      "System",
      {
        borrowerSmsSent: borrowerSms.sent,
        borrowerEmailSent: borrowerEmail.sent,
        brokerSmsSent: brokerSms.sent,
      },
    );

    const tag = REMINDER_TAG;
    await db.lead.update({
      where: { id: lead.id },
      data: {
        additionalInfo: lead.additionalInfo?.includes(tag)
          ? lead.additionalInfo
          : lead.additionalInfo
            ? `${tag} ${lead.additionalInfo}`
            : tag,
      },
    });
    sent++;
  }

  return { sent };
}

/** Consultation booked but not marked complete 2+ hours after slot → escalate */
export async function processConsultationOverdue() {
  const leads = await db.lead.findMany();
  let escalated = 0;

  for (const lead of leads) {
    if (lead.caseStage !== "CONSULTATION_BOOKED") continue;
    if (lead.consultationCompletedAt) continue;
    if (lead.additionalInfo?.includes(CONSULTATION_OVERDUE_TAG)) continue;
    if (!lead.priorityCallSlot || !lead.priorityCallBookedAt) continue;

    const slot = findSlotByLabel(lead.priorityCallSlot);
    if (!slot) continue;

    const londonNow = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(londonNow.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(londonNow.find((p) => p.type === "minute")?.value ?? 0);
    const currentMins = hour * 60 + minute;
    const minsAfterSlot = currentMins - slot.minutes;

    if (minsAfterSlot < 120) continue;

    await db.lead.update({
      where: { id: lead.id },
      data: {
        nextAction: "Mark consultation outcome",
        nextActionAt: new Date(),
        riskLevel: "HIGH",
        riskReason: "Consultation outcome not recorded",
        operationalQueue: "AT_RISK",
        additionalInfo: `${CONSULTATION_OVERDUE_TAG} ${lead.additionalInfo ?? ""}`.trim(),
      },
    });

    await logCaseTimeline(
      lead.id,
      "STAGE_CHANGED",
      "Consultation time passed — outcome not yet recorded.",
      "System",
    );
    escalated++;
  }

  return { escalated };
}

/** Leads with no conversation after 24h → at-risk badge (NN) or At Risk queue (BLB) */
export async function processAtRiskLeads() {
  const leads = await db.lead.findMany();
  let moved = 0;
  const nn = isNeuronourish();

  for (const lead of leads) {
    if (lead.conversationStarted) continue;
    if (lead.status === "LOST" || lead.status === "DISQUALIFIED" || lead.status === "WON") {
      continue;
    }
    if (minutesSince(lead.createdAt) < 24 * 60) continue;

    if (nn) {
      // Badge only — do not exile from New enquiries / Follow-up
      if (lead.riskLevel === "HIGH") continue;
      await db.lead.update({
        where: { id: lead.id },
        data: {
          riskLevel: "HIGH",
          riskReason: "No contact in 24h",
          nextAction: lead.nextAction?.trim()
            ? lead.nextAction
            : "Urgent — no contact in 24h",
        },
      });
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "STATUS_CHANGED",
          description: "Flagged at risk — no conversation within 24 hours",
        },
      });
      moved++;
      continue;
    }

    if (lead.operationalQueue === "AT_RISK") continue;

    await db.lead.update({
      where: { id: lead.id },
      data: {
        operationalQueue: "AT_RISK",
        nextAction: "Urgent — no contact in 24h",
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "STATUS_CHANGED",
        description: "Moved to At Risk — no conversation within 24 hours",
      },
    });
    moved++;
  }

  return { moved };
}

/** Document chase: 24h polite SMS, 48h stronger + high risk, 5d call action */
export async function processDocumentChase() {
  const leads = await db.lead.findMany();
  let reminders = 0;

  for (const lead of leads) {
    if (lead.remindersPaused) continue;
    if (!lead.documentsRequestedAt || lead.caseStage !== "DOCUMENTS_REQUESTED") continue;

    const docs = await db.caseDocument.findMany({ where: { leadId: lead.id } });
    const required = docs.filter((d) => d.required);
    const complete = required.every((d) => d.status === "UPLOADED" || d.status === "ACCEPTED");
    if (complete) continue;

    const hours = (Date.now() - lead.documentsRequestedAt.getTime()) / (60 * 60 * 1000);
    const tag24 = "[Doc chase 24h]";
    const tag48 = "[Doc chase 48h]";
    const tag5d = "[Doc chase 5d]";
    const uploadLink = lead.uploadToken ? uploadPageUrl(lead.uploadToken) : "";

    if (hours >= 120 && !lead.additionalInfo?.includes(tag5d)) {
      await db.lead.update({
        where: { id: lead.id },
        data: {
          nextAction: "Call borrower about outstanding documents",
          nextActionAt: new Date(),
          additionalInfo: lead.additionalInfo?.includes(tag5d)
            ? lead.additionalInfo
            : `${tag5d} ${lead.additionalInfo ?? ""}`.trim(),
        },
      });
      reminders++;
    } else if (hours >= 48 && !lead.additionalInfo?.includes(tag48)) {
      await Promise.all([
        sendSms(lead.phone, documentChase48hSmsBody(lead, uploadLink), {
          audience: "borrower",
          leadId: lead.id,
          purpose: "document-chase-48h",
        }),
        sendJourneyEmail(lead, "document-chase-48h", { uploadLink }, { skipDedup: true }),
      ]);
      await db.lead.update({
        where: { id: lead.id },
        data: {
          riskLevel: "HIGH",
          riskReason: "Documents overdue",
          operationalQueue: "AT_RISK",
          nextAction: "Chase documents",
          nextActionAt: new Date(),
          additionalInfo: `${tag48} ${lead.additionalInfo ?? ""}`.trim(),
        },
      });
      reminders++;
    } else if (hours >= 24 && !lead.additionalInfo?.includes(tag24)) {
      await Promise.all([
        sendSms(lead.phone, documentChase24hSmsBody(lead, uploadLink), {
          audience: "borrower",
          leadId: lead.id,
          purpose: "document-chase-24h",
        }),
        sendJourneyEmail(lead, "document-chase-24h", { uploadLink }, { skipDedup: true }),
      ]);
      await db.lead.update({
        where: { id: lead.id },
        data: {
          additionalInfo: `${tag24} ${lead.additionalInfo ?? ""}`.trim(),
        },
      });
      reminders++;
    }
  }

  return { reminders };
}

export async function processOperationalFollowUps() {
  const [noBooking, reminders, atRisk, docChase, consultationOverdue] = await Promise.all([
    processNoBookingFollowUps(),
    processBookingReminders(),
    processAtRiskLeads(),
    processDocumentChase(),
    processConsultationOverdue(),
  ]);
  return { noBooking, reminders, atRisk, docChase, consultationOverdue };
}
