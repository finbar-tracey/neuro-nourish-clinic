import type { Lead } from "@/generated/prisma/client";
import { brokerNotifyEmail, brokerNotifyPhone } from "@/lib/broker-notify";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { PRIORITY_CALL_BOOKED_PREFIX } from "@/lib/lead-tags";
import { createTeamsMeetingEvent, isCalendarSlotAvailable } from "@/lib/microsoft-graph";
import { priorityCallOperationalFields } from "@/lib/operational-queue";
import { formatDisplayTime, findSlotById, type PrioritySlot } from "@/lib/priority-slots";
import { brokerPriorityCallSmsBody, priorityCallConfirmedSmsBody } from "@/lib/sms-copy";
import { sendSms, smsConfigured } from "@/lib/sms";
import { sendMetaCapiEvent, type MetaCapiInput } from "@/lib/meta-capi";
import { logCaseTimeline } from "@/lib/case-engine";
import { cancelQualifiedBookingChase } from "@/lib/qualified-booking-chase";

export type PriorityCallBookingResult = {
  slotLabel: string;
  displayTime: string;
  leadEmailSent: boolean;
  leadSmsSent: boolean;
  brokerEmailSent: boolean;
  brokerSmsSent: boolean;
  teamsLink: string | null;
};

export class PriorityCallBookingError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_SLOT" | "SLOT_TAKEN" | "CALENDAR_BUSY" | "LEAD_NOT_FOUND",
  ) {
    super(message);
    this.name = "PriorityCallBookingError";
  }
}

function bookingTag(slotLabel: string) {
  return `${PRIORITY_CALL_BOOKED_PREFIX} ${slotLabel}]`;
}

export async function isSlotTaken(slotLabel: string, excludeLeadId?: string) {
  const tag = bookingTag(slotLabel);
  const leads = await db.lead.findMany();
  return leads.some(
    (lead) =>
      lead.id !== excludeLeadId &&
      (lead.priorityCallSlot === slotLabel || lead.additionalInfo?.includes(tag)),
  );
}

function slotStartEndIso(slot: PrioritySlot, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  const day = d + (slot.dayLabel === "Tomorrow" ? 1 : 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hour = Math.floor(slot.minutes / 60);
  const minute = slot.minutes % 60;
  const endMinutes = slot.minutes + 30;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;

  return {
    startIso: `${y}-${m}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`,
    endIso: `${y}-${m}-${pad(day)}T${pad(endHour)}:${pad(endMinute)}:00`,
    slotDueAt: new Date(`${y}-${m}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`),
  };
}

export async function bookPriorityCall(
  lead: Lead,
  slotId: string,
  meta?: Pick<MetaCapiInput, "eventId" | "fbp" | "fbc" | "sourceUrl" | "clientIp" | "userAgent">,
): Promise<PriorityCallBookingResult> {
  const slot = findSlotById(slotId);
  if (!slot) {
    throw new PriorityCallBookingError("Slot is no longer available", "INVALID_SLOT");
  }

  if (await isSlotTaken(slot.label, lead.id)) {
    throw new PriorityCallBookingError("That slot has just been taken", "SLOT_TAKEN");
  }

  const { startIso, endIso, slotDueAt } = slotStartEndIso(slot);

  const calendarFree = await isCalendarSlotAvailable(startIso, endIso);
  if (calendarFree === false) {
    throw new PriorityCallBookingError(
      "Daniel is not available at that time — please choose another slot",
      "CALENDAR_BUSY",
    );
  }

  const tag = bookingTag(slot.label);
  const displayTime = formatDisplayTime(slot);

  const teams = await createTeamsMeetingEvent({
    subject: `Bridging Loan Consultation - ${lead.firstName} ${lead.lastName}`,
    startIso,
    endIso,
    attendeeEmail: lead.email,
    attendeeName: `${lead.firstName} ${lead.lastName}`,
  });

  const leadSmsBody = priorityCallConfirmedSmsBody(lead, displayTime);
  const brokerSmsBody = brokerPriorityCallSmsBody(
    lead,
    displayTime,
    lead.loanPurpose,
    teams.teamsLink,
  );

  const info = lead.additionalInfo?.includes(tag)
    ? lead.additionalInfo
    : lead.additionalInfo
      ? `${tag} ${lead.additionalInfo}`
      : tag;

  await db.lead.update({
    where: { id: lead.id },
    data: {
      additionalInfo: info,
      teamsMeetingUrl: teams.teamsLink,
      outlookEventId: teams.eventId ?? null,
      ...priorityCallOperationalFields(slot.label, displayTime, slotDueAt),
    },
  });

  await cancelQualifiedBookingChase(lead.id);

  const [leadEmail, leadSms, brokerEmail, brokerSms] = await Promise.all([
    sendJourneyEmail(lead, "priority-call-confirmed", {
      displayTime,
      teamsLink: teams.teamsLink,
    }),
    sendSms(lead.phone, leadSmsBody, {
      audience: "borrower",
      leadId: lead.id,
      purpose: "priority-call-confirmed",
    }),
    sendJourneyEmail(
      lead,
      "broker-priority-booked",
      {
        displayTime,
        slotLabel: slot.label,
        teamsLink: teams.teamsLink,
      },
      { skipDedup: true, to: brokerNotifyEmail() },
    ),
    sendSms(brokerNotifyPhone(), brokerSmsBody, {
      audience: "broker",
      leadId: lead.id,
      purpose: "broker-priority-booked",
    }),
  ]);

  await logCaseTimeline(
    lead.id,
    "STATUS_CHANGED",
    `${lead.firstName} booked a priority call for ${displayTime}.`,
    "Borrower",
    { slotId, slotLabel: slot.label, displayTime, teamsLink: teams.teamsLink },
  );

  if (leadEmail.sent || leadSms.sent) {
    await logCaseTimeline(
      lead.id,
      "EMAIL_SENT",
      `Booking confirmation sent to ${lead.firstName}.`,
      "System",
      { leadEmailSent: leadEmail.sent, leadSmsSent: leadSms.sent },
    );
  }

  if (brokerSms.sent) {
    await logCaseTimeline(lead.id, "SMS_SENT", "Daniel was notified about the priority call.", "System");
  } else {
    const detail = brokerSms.error
      ? `Daniel SMS failed: ${brokerSms.error}.`
      : smsConfigured()
        ? "Daniel SMS failed (unknown error)."
        : "Daniel SMS pending — Vonage not configured.";
    await logCaseTimeline(lead.id, "AUTOMATION_RUN", detail, "System", {
      brokerSmsSent: false,
      error: brokerSms.error,
    });
  }

  void sendMetaCapiEvent("Schedule", {
    email: lead.email,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    leadId: lead.id,
    loanAmount: lead.loanAmount,
    currency: "GBP",
    contentName: "Priority Consultation",
    eventId: meta?.eventId ?? `schedule-${lead.id}`,
    fbp: meta?.fbp,
    fbc: meta?.fbc,
    sourceUrl: meta?.sourceUrl,
    fbclid: lead.fbclid ?? undefined,
    clientIp: meta?.clientIp,
    userAgent: meta?.userAgent,
  });

  return {
    slotLabel: slot.label,
    displayTime,
    leadEmailSent: leadEmail.sent,
    leadSmsSent: leadSms.sent,
    brokerEmailSent: brokerEmail.sent,
    brokerSmsSent: brokerSms.sent,
    teamsLink: teams.teamsLink,
  };
}
