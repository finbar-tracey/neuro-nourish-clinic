import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import {
  encodeWinbackTaskMeta,
  winbackEmailTaskTitle,
  winbackSmsTaskTitle,
} from "@/lib/automation-task-meta";
import { cancelNurtureAndWinbackTasks } from "@/lib/cancel-sequence-tasks";
import { resolveWinbackSchedule, type WinbackStep } from "@/lib/winback-schedule";
import { assertWinbackEnrollmentAllowed } from "@/lib/winback-enrollment-guards";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { buildJourneyEmail, emailContextFromLead } from "@/lib/journey-emails";
import { WINBACK_SMS_BODIES } from "@/lib/sms-copy";
import { sendSms } from "@/lib/sms";

async function sendWinbackStepNow(lead: Lead, step: WinbackStep) {
  if (step.channel === "email" && step.emailId) {
    await sendJourneyEmail(lead, step.emailId);
    return;
  }
  if (step.channel === "sms" && step.smsId) {
    const body = WINBACK_SMS_BODIES[step.smsId](lead);
    const result = await sendSms(lead.phone, body, {
      audience: "borrower",
      leadId: lead.id,
      purpose: `winback-${step.smsId}`,
    });
    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "SMS_SENT",
        description: result.sent
          ? `Win-back SMS sent (${step.label})`
          : `Win-back SMS logged (${step.label})`,
        metadata: JSON.stringify({
          sequence: "winback",
          smsId: step.smsId,
          sent: result.sent,
        }),
      },
    });
  }
}

/** Enrol a lost lead on the appropriate win-back sequence. */
export async function enrollWinback(lead: Lead) {
  await assertWinbackEnrollmentAllowed(lead);

  await cancelNurtureAndWinbackTasks(lead.id);

  await db.lead.update({
    where: { id: lead.id },
    data: { nurtureEnrolled: false },
  });

  const { sequenceId, steps } = resolveWinbackSchedule(lead.lostReason);
  const ctx = emailContextFromLead(lead);
  const total = steps.length;

  for (const [index, step] of steps.entries()) {
    if (step.day === 0) {
      await sendWinbackStepNow(lead, step);
      continue;
    }

    const dueDate = new Date(Date.now() + step.day * 24 * 60 * 60 * 1000);
    const meta = encodeWinbackTaskMeta({
      kind: "winback",
      channel: step.channel,
      journeyEmailId: step.emailId,
      smsId: step.smsId,
      step: index + 1,
      total,
      sequenceId,
    });

    const title =
      step.channel === "email"
        ? winbackEmailTaskTitle(buildJourneyEmail(step.emailId!, ctx).subject)
        : winbackSmsTaskTitle(step.label);

    await db.task.create({
      data: {
        leadId: lead.id,
        title,
        description: meta,
        dueDate,
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "AUTOMATION_RUN",
        description: `Win-back ${step.label} scheduled (day ${step.day})`,
        metadata: JSON.stringify({
          sequence: "winback",
          step: index + 1,
          channel: step.channel,
          dueDate: dueDate.toISOString(),
        }),
      },
    });
  }

  const firstFuture = steps.find((s) => s.day > 0);
  const winbackNextAt = firstFuture
    ? new Date(Date.now() + firstFuture.day * 24 * 60 * 60 * 1000)
    : null;

  const lastDay = steps[steps.length - 1]?.day ?? 30;
  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      winbackEnrolled: true,
      winbackStatus: "active",
      winbackSequenceId: sequenceId,
      winbackStep: 1,
      winbackNextAt,
      winbackStoppedReason: null,
    },
  });

  await db.note.create({
    data: {
      leadId: lead.id,
      author: "Automation",
      content: `Enrolled on win-back (${sequenceId}: ${total} steps over ${lastDay} days). Lost reason: ${lead.lostReason}.`,
    },
  });

  await logCaseTimeline(
    lead.id,
    "AUTOMATION_RUN",
    `Win-back sequence started (${total} steps, ${sequenceId}).`,
    "Daniel",
    { sequence: "winback", sequenceId },
  );

  return updated;
}
