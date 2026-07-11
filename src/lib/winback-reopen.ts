import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { transitionCaseStage, logCaseTimeline } from "@/lib/case-engine";
import { STAGE_PROBABILITY } from "@/lib/case-stages";
import { stopWinback } from "@/lib/winback-stop";

/** Re-open a closed lost case and exit win-back. */
export async function reopenCase(lead: Lead) {
  if (lead.status !== "LOST" && lead.caseStage !== "LOST") {
    throw new Error("Only lost cases can be re-opened");
  }

  await stopWinback(lead, "reopened");

  const wasEngaged =
    lead.conversationStarted || lead.lastContactedAt != null || lead.firstResponseAt != null;

  const targetStage = wasEngaged ? "CONTACTED" : "NEW_ENQUIRY";
  const status = wasEngaged ? "CONTACTED" : "NEW";

  const updated = await transitionCaseStage(
    lead,
    targetStage,
    `Case re-opened — ${lead.firstName} moved back to ${targetStage.replace(/_/g, " ").toLowerCase()}.`,
    {
      status,
      lostReason: null,
      remindersPaused: false,
      probability: STAGE_PROBABILITY[targetStage],
      expectedValue: undefined,
      winbackEnrolled: false,
      winbackStatus: "stopped",
      winbackStoppedReason: "reopened",
      winbackStep: 0,
      winbackNextAt: null,
      winbackSequenceId: null,
      operationalQueue: wasEngaged ? "AWAITING_CALLBACK" : "NEW_LEAD",
      nextAction: wasEngaged ? "Follow up call" : "First contact call",
      nextActionAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  );

  await logCaseTimeline(
    lead.id,
    "STATUS_CHANGED",
    "Case re-opened from lost archive.",
    "Daniel",
    { from: "LOST", to: status },
  );

  return updated;
}

export async function resumeWinback(lead: Lead) {
  if (lead.winbackStatus !== "paused") return lead;

  const open = await db.task.findMany({
    where: { leadId: lead.id, completed: false },
  });
  const nextWinback =
    open
      .filter(
        (t) => t.title.startsWith("Win-back email:") || t.title.startsWith("Win-back SMS:"),
      )
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))[0] ?? null;

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      winbackStatus: "active",
      winbackStoppedReason: null,
      winbackNextAt: nextWinback?.dueDate ?? null,
    },
  });

  await logCaseTimeline(
    lead.id,
    "AUTOMATION_RUN",
    "Win-back sequence resumed.",
    "Daniel",
    { sequence: "winback_lost", action: "resumed" },
  );

  return updated;
}
