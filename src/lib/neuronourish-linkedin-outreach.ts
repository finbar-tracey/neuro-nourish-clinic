import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";

const LINKEDIN_FOLLOWUP_DAYS = 3;

/** Log a LinkedIn B2B outreach touch and schedule a CRM follow-up task. */
export async function enrollLinkedInOutreachTask(leadId: string, campaignContentKey: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return { ok: false as const, error: "Lead not found" };
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LINKEDIN_FOLLOWUP_DAYS);

  const isClinician =
    lead.segment === "clinician" ||
    lead.source === "clinics_partnership" ||
    lead.source === "clinics_briefing_pack";
  const isEmployer = lead.segment === "employer" || lead.source === "employer_wellness";

  const stagePatch =
    isClinician && (lead.funnelStage === "eoi_submitted" || !lead.funnelStage)
      ? nnOperationalPatchForStage("clinician_briefing_downloaded")
      : isEmployer && lead.funnelStage === "eoi_submitted"
        ? { funnelStage: "eoi_submitted" as const }
        : {};

  await db.lead.update({
    where: { id: leadId },
    data: stagePatch,
  });

  await db.note.create({
    data: {
      leadId,
      author: "System Operations Liaison",
      content: `Initial B2B LinkedIn campaign message dispatched. Template parameter used: ${campaignContentKey}. Tracking loop armed.`,
    },
  });

  await db.task.create({
    data: {
      leadId,
      title: "Follow up on cold LinkedIn B2B connection",
      description:
        "Check practitioner or corporate inbox for a response. If the lead remains unresponsive, background task runners will auto-transition this record to the briefing nurture sequence.",
      dueDate,
    },
  });

  await logCaseTimeline(
    leadId,
    "AUTOMATION_RUN",
    `LinkedIn outreach logged — template: ${campaignContentKey}`,
    "System",
  );

  return { ok: true as const, dueDate };
}
