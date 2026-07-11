import type { Lead } from "@/generated/prisma/client";
import { CALLBACK_SLA_MINUTES } from "@/lib/operational-queue";
import { coerceDate, coerceDateMs } from "@/lib/utils";

export type SlaStatus = "green" | "amber" | "red" | "neutral";

const SLA_GREEN_MAX = CALLBACK_SLA_MINUTES;
const SLA_AMBER_MAX = 30;

export function minutesSinceLeadCreated(lead: Lead, now = Date.now()): number {
  return Math.floor((now - coerceDateMs(lead.createdAt)) / (60 * 1000));
}

export function minutesWaitingForResponse(lead: Lead, now = Date.now()): number | null {
  if (lead.firstResponseAt) {
    return Math.floor(
      (coerceDateMs(lead.firstResponseAt) - coerceDateMs(lead.createdAt)) / (60 * 1000),
    );
  }
  if (lead.conversationStarted) return 0;
  return minutesSinceLeadCreated(lead, now);
}

export function computeResponseTimeMinutes(lead: Lead, responseAt: Date | string): number {
  return Math.floor(
    (coerceDateMs(responseAt) - coerceDateMs(lead.createdAt)) / (60 * 1000),
  );
}

export function getSlaStatus(lead: Lead, now = Date.now()): SlaStatus {
  if (lead.status === "LOST" || lead.status === "DISQUALIFIED" || lead.status === "WON") {
    return "neutral";
  }

  const waited = lead.firstResponseAt
    ? computeResponseTimeMinutes(lead, lead.firstResponseAt)
    : minutesSinceLeadCreated(lead, now);

  if (lead.firstResponseAt || lead.conversationStarted) {
    if (waited <= SLA_GREEN_MAX) return "green";
    if (waited <= SLA_AMBER_MAX) return "amber";
    return "red";
  }

  if (waited < SLA_GREEN_MAX) return "green";
  if (waited <= SLA_AMBER_MAX) return "amber";
  return "red";
}

export function slaStatusLabel(status: SlaStatus): string {
  switch (status) {
    case "green":
      return "Within SLA";
    case "amber":
      return "15–30 mins";
    case "red":
      return "Overdue";
    default:
      return "Closed";
  }
}

export function slaStatusClasses(status: SlaStatus): string {
  switch (status) {
    case "green":
      return "border-emerald-200 bg-emerald-50/80 ring-emerald-100";
    case "amber":
      return "border-amber-200 bg-amber-50/80 ring-amber-100";
    case "red":
      return "border-red-200 bg-red-50/80 ring-red-100";
    default:
      return "border-slate-200 bg-white";
  }
}

export function slaBadgeClasses(status: SlaStatus): string {
  switch (status) {
    case "green":
      return "bg-emerald-100 text-emerald-800";
    case "amber":
      return "bg-amber-100 text-amber-900";
    case "red":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function formatResponseTime(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatWaitingLabel(lead: Lead): string {
  if (lead.firstResponseAt && lead.responseTimeMinutes != null) {
    return `Responded in ${formatResponseTime(lead.responseTimeMinutes)}`;
  }
  const waiting = minutesSinceLeadCreated(lead);
  if (lead.conversationStarted) return "In conversation";
  return `No contact · ${formatResponseTime(waiting)}`;
}

/** Default bridging broker commission estimate ~1.5% of loan */
export function estimateCommission(loanAmount: number): number {
  return Math.round(loanAmount * 0.015);
}

export function computeInboxMetrics(leads: Lead[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const todayLeads = leads.filter((l) => coerceDateMs(l.createdAt) >= todayStartMs);
  const responded = todayLeads.filter((l) => l.responseTimeMinutes != null);
  const avgResponse =
    responded.length > 0
      ? Math.round(
          responded.reduce((sum, l) => sum + (l.responseTimeMinutes ?? 0), 0) / responded.length,
        )
      : null;

  const atRisk = leads.filter(
    (l) =>
      l.operationalQueue === "AT_RISK" ||
      (getSlaStatus(l) === "red" && !l.conversationStarted && l.status === "NEW"),
  ).length;

  const pipelineValue = leads
    .filter((l) => l.operationalQueue === "APPLICATION" || l.operationalQueue === "COMPLETION")
    .reduce((sum, l) => sum + (l.estimatedCommission ?? estimateCommission(l.loanAmount)), 0);

  return {
    leadsToday: todayLeads.length,
    avgResponseMinutes: avgResponse,
    atRiskCount: atRisk,
    pipelineCommission: pipelineValue,
    slaTargetMinutes: SLA_GREEN_MAX,
  };
}
