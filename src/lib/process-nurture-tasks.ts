import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";

/** Send nurture emails whose scheduled tasks are due */
export async function processDueNurtureEmails() {
  const dueTasks = await db.task.findMany({
    where: {
      completed: false,
      dueDate: { lte: new Date() },
      title: { startsWith: "Send nurture email:" },
    },
    take: 20,
  });

  let sent = 0;

  for (const task of dueTasks) {
    const lead = await db.lead.findUnique({ where: { id: task.leadId } });
    if (!lead?.email || lead.status !== "FOLLOW_UP") {
      await db.task.update({
        where: { id: task.id },
        data: { completed: true },
      });
      continue;
    }

    if (isEmailOptedOut(lead.additionalInfo)) {
      await db.task.update({
        where: { id: task.id },
        data: { completed: true },
      });
      continue;
    }

    const subject = task.title.replace(/^Send nurture email:\s*/, "");
    const body = task.description ?? "";

    const result = await sendEmail({
      to: lead.email,
      subject,
      body,
      category: "marketing",
    });

    await db.task.update({
      where: { id: task.id },
      data: { completed: true },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL_SENT",
        description: result.sent
          ? `Nurture email sent: ${subject}`
          : `Nurture email logged: ${subject}`,
        metadata: JSON.stringify({
          sequence: "long_timeframe_nurture",
          taskId: task.id,
          sent: result.sent,
          resendId: result.id,
        }),
      },
    });

    if (result.sent) sent++;
  }

  return { processed: dueTasks.length, sent };
}
