import { db } from "@/lib/db";
import { sendSms, smsConfigured } from "@/lib/sms";

const BOOKING_INTENT_TAG = "[Booking intent — call within 30 min]";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function chaseBookingIntent(leadId: string, preferredSlot: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const existingTask = await db.task.findFirst({
    where: {
      leadId,
      completed: false,
      title: { startsWith: "Booking intent" },
    },
  });
  if (!existingTask) {
    await db.task.create({
      data: {
        leadId,
        title: `Booking intent — call within 30 min (${preferredSlot})`,
        description: `Patient selected ${preferredSlot} but did not reserve. Call to complete booking.`,
        dueDate: addMinutes(new Date(), 30),
      },
    });
  }

  if (!lead.additionalInfo?.includes(BOOKING_INTENT_TAG)) {
    await db.lead.update({
      where: { id: leadId },
      data: {
        additionalInfo: lead.additionalInfo
          ? `${BOOKING_INTENT_TAG} ${lead.additionalInfo}`
          : BOOKING_INTENT_TAG,
        nextAction: "Call — slot selected, not reserved",
        nextActionAt: addMinutes(new Date(), 30),
      },
    });
  }

  if (smsConfigured()) {
    const first = lead.firstName?.trim() || "there";
    const body = `Hi ${first}, your ${preferredSlot} implant consultation slot is held briefly. Reply or tap the link we emailed to confirm your booking.`;
    const result = await sendSms(lead.phone, body, {
      audience: "borrower",
      leadId: lead.id,
      purpose: "booking-intent-chase",
    });
    await db.activity.create({
      data: {
        leadId,
        type: "SMS_SENT",
        description: result.sent
          ? "Booking-intent chase SMS sent"
          : "Booking-intent chase SMS failed",
        metadata: JSON.stringify({ preferredSlot, sent: result.sent, error: result.error }),
      },
    });
  }
}
