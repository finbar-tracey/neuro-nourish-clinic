import { ActivityType, type Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { transitionCaseStage, logCaseTimeline } from "@/lib/case-engine";
import { inferCaseStage } from "@/lib/case-stages";
import { missedCallSmsBody } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";
import { autoPauseWinbackOnReengagement } from "@/lib/winback-auto-pause";
import { computeResponseTimeMinutes } from "@/lib/speed-to-lead";
import { maybeEnrollBookingChaseAfterNoAnswer } from "@/lib/qualified-booking-chase";

export type ContactLogInput = {
  channel: "call" | "sms" | "email" | "whatsapp";
  outcome?: "attempted" | "no_answer" | "connected" | "sent";
  note?: string;
};

const CHANNEL_ACTIVITY: Record<
  ContactLogInput["channel"],
  { attempted: ActivityType; connected?: ActivityType; sent?: ActivityType }
> = {
  call: {
    attempted: ActivityType.CALL_ATTEMPTED,
    connected: ActivityType.CALL_CONNECTED,
  },
  sms: {
    attempted: ActivityType.SMS_SENT,
    sent: ActivityType.SMS_SENT,
  },
  email: {
    attempted: ActivityType.EMAIL_SENT,
    sent: ActivityType.EMAIL_SENT,
  },
  whatsapp: {
    attempted: ActivityType.SMS_SENT,
    sent: ActivityType.SMS_SENT,
  },
};

function activityDescription(input: ContactLogInput, lead: Lead): string {
  const name = lead.firstName;
  switch (input.channel) {
    case "call":
      if (input.outcome === "connected") return `Daniel spoke to ${name}.`;
      if (input.outcome === "no_answer") return `Daniel called ${name} — no answer.`;
      return `Daniel started a call with ${name}.`;
    case "sms":
      return `SMS sent to ${name}.`;
    case "email":
      return `Email sent to ${name}.`;
    case "whatsapp":
      return `WhatsApp opened for ${name}.`;
    default:
      return `Contact logged for ${name}.`;
  }
}

export async function logContactAttempt(lead: Lead, input: ContactLogInput) {
  const now = new Date();
  const isFirstResponse = !lead.firstResponseAt;
  const isConnected = input.outcome === "connected";
  const mapping = CHANNEL_ACTIVITY[input.channel];

  let activityType = mapping.attempted;
  if (isConnected && mapping.connected) activityType = mapping.connected;
  else if (input.outcome === "sent" && mapping.sent) activityType = mapping.sent;

  const updateData: Partial<Lead> = {
    lastContactedAt: now,
  };

  if (isFirstResponse) {
    updateData.firstResponseAt = now;
    updateData.responseTimeMinutes = computeResponseTimeMinutes(lead, now);
  }

  let updated = lead;

  if (isConnected) {
    const currentStage = inferCaseStage(lead);
    const stageOrder = [
      "NEW_ENQUIRY",
      "CONTACT_DUE",
      "CONTACTED",
      "CONSULTATION_BOOKED",
    ] as const;
    const shouldAdvance =
      stageOrder.includes(currentStage as (typeof stageOrder)[number]) &&
      currentStage !== "CONSULTATION_BOOKED";

    if (shouldAdvance) {
      updated = await transitionCaseStage(
        lead,
        "CONTACTED",
        `Daniel marked ${lead.firstName} as contacted.`,
        {
          conversationStarted: true,
          status: lead.status === "NEW" ? "CONTACTED" : lead.status,
          firstResponseAt: updateData.firstResponseAt ?? lead.firstResponseAt,
          responseTimeMinutes: updateData.responseTimeMinutes ?? lead.responseTimeMinutes,
          lastContactedAt: now,
        },
      );
    } else {
      updated = await db.lead.update({
        where: { id: lead.id },
        data: {
          ...updateData,
          conversationStarted: true,
          status: lead.status === "NEW" ? "CONTACTED" : lead.status,
        },
      });
    }
  } else if (input.channel === "call" && input.outcome === "no_answer") {
    const retryAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const noAnswerCount = (lead.noAnswerCount ?? 0) + 1;
    updated = await db.lead.update({
      where: { id: lead.id },
      data: {
        ...updateData,
        noAnswerCount,
        nextAction: "Try calling again",
        nextActionAt: retryAt,
      },
    });
    updated = await maybeEnrollBookingChaseAfterNoAnswer(updated);
    await sendSms(
      lead.phone,
      missedCallSmsBody(lead.firstName),
      { audience: "borrower", leadId: lead.id, purpose: "missed-call" },
    ).catch(() => null);
  } else if (input.channel === "call" && input.outcome === "attempted") {
    updated = await db.lead.update({
      where: { id: lead.id },
      data: updateData,
    });
  } else {
    updated = await db.lead.update({
      where: { id: lead.id },
      data: updateData,
    });
  }

  await logCaseTimeline(
    lead.id,
    activityType,
    activityDescription(input, lead),
    "Daniel",
    {
      channel: input.channel,
      outcome: input.outcome ?? "attempted",
      responseTimeMinutes: updated.responseTimeMinutes,
      note: input.note ?? null,
    },
  );

  if (isConnected) {
    const fresh = await db.lead.findUnique({ where: { id: lead.id } });
    if (fresh?.winbackStatus === "active") {
      return autoPauseWinbackOnReengagement(fresh, "call_connected");
    }
  }

  return updated;
}
