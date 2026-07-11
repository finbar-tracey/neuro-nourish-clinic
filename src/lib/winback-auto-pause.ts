import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";

/** Pause active win-back when the borrower re-engages (contact, call, new form). */
export async function autoPauseWinbackOnReengagement(
  lead: Lead,
  trigger: "marked_contacted" | "call_connected" | "new_form",
) {
  if (lead.winbackStatus !== "active") return lead;

  const labels: Record<typeof trigger, string> = {
    marked_contacted: "Daniel marked as contacted",
    call_connected: "call connected",
    new_form: "new form submitted",
  };

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      winbackStatus: "paused",
      winbackStoppedReason: "re_engaged",
    },
  });

  await logCaseTimeline(
    lead.id,
    "AUTOMATION_RUN",
    `Win-back paused — borrower re-engaged (${labels[trigger]}).`,
    "System",
    { sequence: "winback", action: "auto_paused", trigger },
  );

  return updated;
}

/** Pause win-back on any lost lead with this email that is actively on a sequence. */
export async function autoPauseWinbackForEmail(
  email: string,
  trigger: "new_form",
  excludeLeadId?: string,
) {
  const normalized = email.trim().toLowerCase();
  const leads = await db.lead.findMany();
  let paused = 0;

  for (const lead of leads) {
    if (excludeLeadId && lead.id === excludeLeadId) continue;
    if (lead.email.trim().toLowerCase() !== normalized) continue;
    if (lead.winbackStatus !== "active") continue;
    await autoPauseWinbackOnReengagement(lead, trigger);
    paused++;
  }

  return paused;
}
