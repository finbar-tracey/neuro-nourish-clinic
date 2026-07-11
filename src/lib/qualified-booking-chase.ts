import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import { qualifiedBookingChaseSmsBody, smsActivityDescription } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";
import { cancelSequenceTasksByPrefix } from "@/lib/cancel-sequence-tasks";

const TASK_PREFIX = "qualified-booking-chase";
const CHASE_DAYS = 7;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isQualifiedReachableLead(lead: Lead): boolean {
  if (!lead.formCompleted) return false;
  if (lead.qualificationTier === "partial") return false;
  if (lead.status === "LOST" || lead.status === "DISQUALIFIED" || lead.status === "WON") {
    return false;
  }
  if (lead.caseStage === "CONSULTATION_BOOKED" || lead.priorityCallBookedAt) return false;
  if (lead.bookingChaseEnrolled) return false;
  return true;
}

export async function enrollQualifiedBookingChase(lead: Lead) {
  if (!isQualifiedReachableLead(lead)) return lead;

  const now = new Date();
  const tasks = Array.from({ length: CHASE_DAYS + 1 }, (_, day) => ({
    title: `${TASK_PREFIX}-day-${day}: ${day % 2 === 0 ? "SMS" : "Email"}`,
    dueDate: addDays(now, day),
  }));

  await db.task.createMany({
    data: tasks.map((task) => ({
      leadId: lead.id,
      title: task.title,
      description: `Booking chase day ${task.title.match(/day-(\d+)/)?.[1] ?? "?"}`,
      dueDate: task.dueDate,
    })),
  });

  return db.lead.update({
    where: { id: lead.id },
    data: {
      bookingChaseEnrolled: true,
      bookingChaseStep: 0,
      bookingChaseNextAt: addDays(now, 1),
    },
  });
}

export async function cancelQualifiedBookingChase(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, TASK_PREFIX);
  await db.lead.update({
    where: { id: leadId },
    data: {
      bookingChaseEnrolled: false,
      bookingChaseStep: 0,
      bookingChaseNextAt: null,
    },
  });
}

async function shouldSkipChase(lead: Lead | null): Promise<boolean> {
  if (!lead) return true;
  if (lead.priorityCallBookedAt || lead.status === "BOOKED") return true;
  if (lead.caseStage === "CONSULTATION_BOOKED") return true;
  if (lead.status === "LOST" || lead.status === "DISQUALIFIED" || lead.status === "WON") {
    return true;
  }
  if (lead.conversationStarted && lead.status === "CONTACTED") return true;
  return false;
}

const EMAIL_BY_DAY: Record<number, "qualified-chase-day-1" | "qualified-chase-day-3" | "qualified-chase-day-5" | "qualified-chase-day-7"> = {
  1: "qualified-chase-day-1",
  3: "qualified-chase-day-3",
  5: "qualified-chase-day-5",
  7: "qualified-chase-day-7",
};

export async function processDueQualifiedBookingChase() {
  const dueTasks = await db.task.findMany({
    where: {
      completed: false,
      dueDate: { lte: new Date() },
      title: { startsWith: TASK_PREFIX },
    },
    take: 20,
  });

  let processed = 0;

  for (const task of dueTasks) {
    const lead = await db.lead.findUnique({ where: { id: task.leadId } });
    if (await shouldSkipChase(lead)) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      if (lead) await cancelQualifiedBookingChase(lead.id);
      continue;
    }

    const dayMatch = task.title.match(/day-(\d+)/);
    const day = dayMatch ? Number(dayMatch[1]) : 0;

    if (day % 2 === 0) {
      const body = qualifiedBookingChaseSmsBody(lead!, day);
      const result = await sendSms(lead!.phone, body, {
        audience: "borrower",
        leadId: lead!.id,
        purpose: `qualified-booking-chase-day-${day}`,
      });
      await db.activity.create({
        data: {
          leadId: lead!.id,
          type: "AUTOMATION_RUN",
          description: smsActivityDescription(`Qualified booking chase day ${day} SMS`, result),
          metadata: JSON.stringify({ sent: result.sent, error: result.error, day }),
        },
      });
    } else if (lead!.email && !isEmailOptedOut(lead!.additionalInfo)) {
      const emailId = EMAIL_BY_DAY[day];
      if (emailId) {
        await sendJourneyEmail(lead!, emailId);
      }
    }

    await db.lead.update({
      where: { id: lead!.id },
      data: {
        bookingChaseStep: day,
        bookingChaseNextAt: day < CHASE_DAYS ? addDays(new Date(), 1) : null,
      },
    });

    await db.task.update({ where: { id: task.id }, data: { completed: true } });
    processed += 1;
  }

  return { processed };
}

export async function maybeEnrollBookingChaseAfterNoAnswer(lead: Lead) {
  if (lead.noAnswerCount < 2) return lead;
  if (!isQualifiedReachableLead(lead)) return lead;
  return enrollQualifiedBookingChase(lead);
}
