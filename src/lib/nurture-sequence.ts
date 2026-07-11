import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  NURTURE_EMAIL_SCHEDULE,
  buildJourneyEmail,
  emailContextFromLead,
} from "@/lib/journey-emails";
import { sendJourneyEmail } from "@/lib/journey-email-send";

/** Enrol a long-timeframe lead on the automated email nurture sequence */
export async function enrollLongTimeframeNurture(lead: Lead) {
  await db.lead.update({
    where: { id: lead.id },
    data: { nurtureEnrolled: true },
  });

  await db.note.create({
    data: {
      leadId: lead.id,
      author: "Automation",
      content: `Enrolled on long-timeframe nurture sequence (${NURTURE_EMAIL_SCHEDULE.length} emails over 30 days). Timeframe: ${lead.timeframe}.`,
    },
  });

  const ctx = emailContextFromLead(lead);

  for (const [index, step] of NURTURE_EMAIL_SCHEDULE.entries()) {
    const email = buildJourneyEmail(step.id, ctx);

    if (step.day === 0) {
      await sendJourneyEmail(lead, step.id);
    } else {
      const dueDate = new Date(Date.now() + step.day * 24 * 60 * 60 * 1000);
      await db.task.create({
        data: {
          leadId: lead.id,
          title: `Send nurture email: ${email.subject}`,
          description: email.body,
          dueDate,
        },
      });
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "AUTOMATION_RUN",
          description: `Nurture email ${index + 1}/${NURTURE_EMAIL_SCHEDULE.length} scheduled (day ${step.day})`,
          metadata: JSON.stringify({
            sequence: "long_timeframe_nurture",
            step: index + 1,
            journeyEmailId: step.id,
            subject: email.subject,
            dueDate: dueDate.toISOString(),
          }),
        },
      });
    }
  }
}
