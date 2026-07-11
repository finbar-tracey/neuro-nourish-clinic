import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { cancelWinbackTasks } from "@/lib/cancel-sequence-tasks";

export type WinbackStoppedReason =
  | "manual"
  | "paused"
  | "reopened"
  | "opted_out"
  | "replied"
  | "re_engaged"
  | "disqualified"
  | "completed";

export async function pauseWinback(lead: Lead) {
  if (lead.winbackStatus !== "active") return lead;

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      winbackStatus: "paused",
      winbackStoppedReason: "paused",
    },
  });

  await logCaseTimeline(
    lead.id,
    "AUTOMATION_RUN",
    "Win-back sequence paused.",
    "Daniel",
    { sequence: "winback_lost", action: "paused" },
  );

  return updated;
}

export async function stopWinback(lead: Lead, reason: WinbackStoppedReason) {
  if (!lead.winbackEnrolled && lead.winbackStatus !== "active" && lead.winbackStatus !== "paused") {
    return lead;
  }

  await cancelWinbackTasks(lead.id);

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      winbackEnrolled: reason === "completed",
      winbackStatus: reason === "completed" ? "completed" : "stopped",
      winbackStoppedReason: reason,
      winbackNextAt: null,
    },
  });

  const label =
    reason === "completed"
      ? "Win-back sequence completed."
      : `Win-back sequence stopped (${reason.replace(/_/g, " ")}).`;

  await logCaseTimeline(lead.id, "AUTOMATION_RUN", label, "System", {
    sequence: "winback_lost",
    action: "stopped",
    reason,
  });

  return updated;
}
