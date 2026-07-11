import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import {
  isWinbackSequenceTask,
  parseWinbackTaskMeta,
} from "@/lib/automation-task-meta";
import { stopWinback } from "@/lib/winback-stop";
import { WINBACK_SMS_BODIES } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";

const MIN_HOURS_BETWEEN_SENDS = 72;

async function recentWinbackSend(leadId: string): Promise<boolean> {
  const activities = await db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const cutoff = Date.now() - MIN_HOURS_BETWEEN_SENDS * 60 * 60 * 1000;
  return activities
    .filter((a) => a.leadId === leadId)
    .some((a) => {
      if (a.type !== "EMAIL_SENT" && a.type !== "SMS_SENT") return false;
      if (!a.description.includes("Win-back")) return false;
      return a.createdAt.getTime() > cutoff;
    });
}

function isWinbackTaskDue(title: string) {
  return title.startsWith("Win-back email:") || title.startsWith("Win-back SMS:");
}

/** Send due win-back emails and SMS steps. */
export async function processDueWinbackEmails() {
  const allOpen = await db.task.findMany({
    where: { completed: false },
  });
  const dueTasks = allOpen
    .filter(
      (t) =>
        isWinbackTaskDue(t.title) &&
        t.dueDate != null &&
        t.dueDate <= new Date(),
    )
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 20);

  let sent = 0;

  for (const task of dueTasks) {
    if (!isWinbackSequenceTask(task.title)) continue;

    const meta = parseWinbackTaskMeta(task.description);
    const lead = await db.lead.findUnique({ where: { id: task.leadId } });

    if (!lead?.email || lead.status !== "LOST") {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (lead.winbackStatus === "paused") continue;

    if (lead.winbackStatus !== "active") {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (isEmailOptedOut(lead.additionalInfo) && meta?.channel === "email") {
      await stopWinback(lead, "opted_out");
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (await recentWinbackSend(lead.id)) {
      continue;
    }

    if (meta?.channel === "email" && meta.journeyEmailId) {
      const result = await sendJourneyEmail(lead, meta.journeyEmailId);
      if (result.sent) sent++;
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "EMAIL_SENT",
          description: result.sent
            ? `Win-back email sent: ${task.title.replace(/^Win-back email:\s*/, "")}`
            : `Win-back email logged: ${task.title.replace(/^Win-back email:\s*/, "")}`,
          metadata: JSON.stringify({
            sequence: "winback",
            taskId: task.id,
            journeyEmailId: meta.journeyEmailId,
            step: meta.step,
            sent: result.sent,
          }),
        },
      });
    } else if (meta?.channel === "sms" && meta.smsId) {
      const bodyFn = WINBACK_SMS_BODIES[meta.smsId];
      const result = await sendSms(lead.phone, bodyFn(lead), {
        audience: "borrower",
        leadId: lead.id,
        purpose: `winback-${meta.smsId}`,
      });
      if (result.sent) sent++;
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "SMS_SENT",
          description: result.sent
            ? `Win-back SMS sent (${meta.smsId})`
            : `Win-back SMS logged (${meta.smsId})`,
          metadata: JSON.stringify({
            sequence: "winback",
            taskId: task.id,
            smsId: meta.smsId,
            step: meta.step,
            sent: result.sent,
          }),
        },
      });
    } else {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    await db.task.update({ where: { id: task.id }, data: { completed: true } });

    const step = meta?.step ?? lead.winbackStep + 1;
    const total = meta?.total ?? step;

    const nextTask = await findNextWinbackTask(lead.id);

    const isLastStep = step >= total || !nextTask;

    if (isLastStep) {
      await stopWinback(
        await db.lead.update({
          where: { id: lead.id },
          data: { winbackStep: step, winbackNextAt: null },
        }),
        "completed",
      );
    } else {
      await db.lead.update({
        where: { id: lead.id },
        data: {
          winbackStep: step,
          winbackNextAt: nextTask?.dueDate ?? null,
        },
      });
    }
  }

  return { processed: dueTasks.length, sent };
}

async function findNextWinbackTask(leadId: string) {
  const open = await db.task.findMany({ where: { leadId, completed: false } });
  return (
    open
      .filter((t) => isWinbackTaskDue(t.title))
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))[0] ?? null
  );
}
