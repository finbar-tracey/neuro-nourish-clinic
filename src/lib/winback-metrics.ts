import type { Lead } from "@/generated/prisma/client";
import { isWinbackDueToday } from "@/lib/workspace-case";
import { leadToCase } from "@/lib/case";

export type WinbackMetrics = {
  enrolled: number;
  active: number;
  paused: number;
  completed: number;
  stopped: number;
  dueToday: number;
  reEngaged: number;
};

export function computeWinbackMetrics(leads: Lead[]): WinbackMetrics {
  const metrics: WinbackMetrics = {
    enrolled: 0,
    active: 0,
    paused: 0,
    completed: 0,
    stopped: 0,
    dueToday: 0,
    reEngaged: 0,
  };

  for (const lead of leads) {
    if (!lead.winbackEnrolled && !lead.winbackStatus) continue;
    if (lead.winbackEnrolled) metrics.enrolled++;

    switch (lead.winbackStatus) {
      case "active":
        metrics.active++;
        if (isWinbackDueToday(leadToCase(lead))) metrics.dueToday++;
        break;
      case "paused":
        metrics.paused++;
        if (lead.winbackStoppedReason === "re_engaged") metrics.reEngaged++;
        break;
      case "completed":
        metrics.completed++;
        break;
      case "stopped":
        metrics.stopped++;
        if (lead.winbackStoppedReason === "reopened") metrics.reEngaged++;
        break;
      default:
        break;
    }
  }

  return metrics;
}
