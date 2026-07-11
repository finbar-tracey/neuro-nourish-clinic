import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { signCompletionToken } from "@/lib/completion-link";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import { borrowerCompleteUrl } from "@/lib/sms-links";
import {
  metaCompleteChase2hSmsBody,
  metaCompleteChase72hSmsBody,
  smsActivityDescription,
} from "@/lib/sms-copy";
import { isMetaInstantFormSource } from "@/lib/meta-source";
import { sendSms } from "@/lib/sms";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";

const TASK_PREFIX = "meta-complete-chase";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function completeUrlForLead(leadId: string, storedUrl?: string | null): string | null {
  if (storedUrl) return storedUrl;
  const token = signCompletionToken(leadId);
  if (!token) return null;
  return borrowerCompleteUrl(leadId, token);
}

export async function scheduleMetaCompleteChase(leadId: string, completeUrl: string) {
  const now = new Date();
  const tasks = [
    {
      title: `${TASK_PREFIX}-2h: SMS reminder`,
      description: completeUrl,
      dueDate: addHours(now, 2),
    },
    {
      title: `${TASK_PREFIX}-24h: Email reminder`,
      description: completeUrl,
      dueDate: addHours(now, 24),
    },
    {
      title: `${TASK_PREFIX}-72h: Winback SMS`,
      description: completeUrl,
      dueDate: addHours(now, 72),
    },
    {
      title: `${TASK_PREFIX}-7d: Nurture enroll`,
      description: completeUrl,
      dueDate: addDays(now, 7),
    },
  ];

  await db.task.createMany({
    data: tasks.map((task) => ({
      leadId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
    })),
  });
}

export async function cancelMetaCompleteChaseTasks(leadId: string) {
  await db.task.updateMany({
    where: {
      leadId,
      completed: false,
      title: { startsWith: TASK_PREFIX },
    },
    data: { completed: true },
  });
}

async function shouldSkipChase(lead: Lead | null): Promise<boolean> {
  if (!lead) return true;
  if (lead.formCompleted) return true;
  if (!isMetaInstantFormSource(lead.source)) return true;
  return false;
}

export async function processDueMetaCompleteChase() {
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
      continue;
    }

    const completeUrl = completeUrlForLead(task.leadId, task.description);
    if (!completeUrl) {
      await db.task.update({ where: { id: task.id }, data: { completed: true } });
      continue;
    }

    if (task.title.includes("-2h:")) {
      const body = metaCompleteChase2hSmsBody(lead!, completeUrl);
      const result = await sendSms(lead!.phone, body, {
        audience: "borrower",
        leadId: lead!.id,
        purpose: "meta-complete-chase-2h",
      });
      await db.activity.create({
        data: {
          leadId: lead!.id,
          type: "AUTOMATION_RUN",
          description: smsActivityDescription("Meta complete chase 2h SMS", result),
          metadata: JSON.stringify({ sent: result.sent, error: result.error }),
        },
      });
    } else if (task.title.includes("-24h:")) {
      await sendJourneyEmail(lead!, "meta-capture-welcome", { completeUrl });
    } else if (task.title.includes("-72h:")) {
      const body = metaCompleteChase72hSmsBody(lead!, completeUrl);
      const result = await sendSms(lead!.phone, body, {
        audience: "borrower",
        leadId: lead!.id,
        purpose: "meta-complete-chase-72h",
      });
      await db.activity.create({
        data: {
          leadId: lead!.id,
          type: "AUTOMATION_RUN",
          description: smsActivityDescription("Meta complete chase 72h SMS", result),
          metadata: JSON.stringify({ sent: result.sent, error: result.error }),
        },
      });
    } else if (task.title.includes("-7d:")) {
      if (!lead!.nurtureEnrolled && lead!.email && !isEmailOptedOut(lead!.additionalInfo)) {
        await db.lead.update({
          where: { id: lead!.id },
          data: {
            status: "FOLLOW_UP",
            nurtureEnrolled: true,
            additionalInfo: lead!.additionalInfo
              ? `${lead!.additionalInfo} [Nurture: meta incomplete 7d]`
              : "[Nurture: meta incomplete 7d]",
          },
        });
        await enrollLongTimeframeNurture(lead!);
      }
    }

    await db.task.update({ where: { id: task.id }, data: { completed: true } });
    processed += 1;
  }

  return { processed };
}
