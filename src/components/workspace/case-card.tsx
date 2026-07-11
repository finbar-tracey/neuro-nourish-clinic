"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, PoundSterling } from "lucide-react";
import { CaseCardFooter } from "@/components/workspace/case-card-footer";
import {
  slaBadgeClasses,
  slaStatusLabel,
  type CaseView,
  type SlaStatus,
} from "@/lib/case";
import { stageLabel } from "@/lib/case-stages";
import { getQualificationPill } from "@/lib/lead-pipeline";
import { INBOX_QUEUES } from "@/lib/operational-queue";
import { formatCurrency, cn } from "@/lib/utils";
import { attributionSummary } from "@/lib/attribution-display";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import { nnCaseCardMeta, nnQueueOverrides } from "@/lib/neuronourish-workspace";

type Props = {
  caseItem: CaseView;
  onRefresh?: () => void;
  showActions?: boolean;
  showQueue?: boolean;
};

function dueLabel(due: Date | null) {
  if (!due) return null;
  const diff = due.getTime() - Date.now();
  const mins = Math.round(Math.abs(diff) / 60000);
  if (diff >= 0) return mins < 60 ? `Due ${mins}m` : `Due ${Math.ceil(mins / 60)}h`;
  return mins < 60 ? `${mins}m overdue` : `${Math.ceil(mins / 60)}h overdue`;
}

function formatCardDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(date),
  );
}

function slaAccentBorder(status: SlaStatus): string {
  switch (status) {
    case "OVERDUE":
    case "AT_RISK":
      return "border-l-red-500";
    case "DUE_SOON":
      return "border-l-amber-400";
    case "ON_TRACK":
      return "border-l-emerald-400";
    default:
      return "border-l-slate-200";
  }
}

function queueMeta(queueId: string) {
  if (isNeuronourishVertical()) {
    const overrides = nnQueueOverrides()[queueId];
    if (overrides) {
      return {
        id: queueId,
        label: overrides.label,
        emoji: overrides.emoji,
        description: overrides.description,
        color: INBOX_QUEUES.find((q) => q.id === queueId)?.color ?? "border-slate-200 bg-slate-50/60",
        header: INBOX_QUEUES.find((q) => q.id === queueId)?.header ?? "bg-slate-600",
      };
    }
  }
  return INBOX_QUEUES.find((q) => q.id === queueId);
}

const QUEUE_TEXT: Record<string, string> = {
  NEW_LEAD: "text-orange-900",
  AWAITING_CALLBACK: "text-violet-900",
  AWAITING_DOCUMENTS: "text-amber-900",
  APPLICATION: "text-blue-900",
  COMPLETION: "text-emerald-900",
  AT_RISK: "text-red-900",
};

type BadgeItem = { key: string; label: string; className: string };

/** Max 2 badges — no duplicate queue + SLA "At risk" spam */
export function pickCaseBadges(
  c: CaseView,
  showQueue: boolean,
  queue: ReturnType<typeof queueMeta>,
  qualPill: ReturnType<typeof getQualificationPill>,
): BadgeItem[] {
  const items: BadgeItem[] = [];

  const queueShowsAtRisk = showQueue && queue?.id === "AT_RISK";
  const slaIsUrgent = c.slaStatus === "AT_RISK" || c.slaStatus === "OVERDUE";
  const stageMatchesQueue =
    (showQueue && queue?.id === "NEW_LEAD" && c.stage === "NEW_ENQUIRY") ||
    (showQueue && queue?.id === "AWAITING_CALLBACK" && c.stage === "CONSULTATION_BOOKED") ||
    (showQueue && queue?.id === "AWAITING_DOCUMENTS" && c.stage === "DOCUMENTS_REQUESTED");

  if (showQueue && queue) {
    items.push({
      key: "queue",
      label: `${queue.emoji} ${queue.label}`,
      className: cn("border", queue.color, QUEUE_TEXT[queue.id] ?? "text-slate-800"),
    });
  }

  if (!stageMatchesQueue) {
    items.push({
      key: "stage",
      label: stageLabel(c.stage),
      className: "bg-navy/10 text-navy",
    });
  }

  if (!queueShowsAtRisk && slaIsUrgent) {
    items.push({
      key: "sla",
      label: slaStatusLabel(c.slaStatus),
      className: slaBadgeClasses(c.slaStatus),
    });
  } else if (!showQueue && c.slaStatus !== "ON_TRACK") {
    items.push({
      key: "sla",
      label: slaStatusLabel(c.slaStatus),
      className: slaBadgeClasses(c.slaStatus),
    });
  }

  if (qualPill && !c.formCompleted) {
    items.push({ key: "qual", label: qualPill.label, className: qualPill.color });
  }

  if (
    c.riskLevel === "HIGH" &&
    !slaIsUrgent &&
    c.riskReason &&
    !queueShowsAtRisk
  ) {
    items.push({
      key: "risk",
      label: c.riskReason,
      className: "bg-red-100 text-red-800",
    });
  }

  return items.slice(0, 2);
}

export function CaseCard({
  caseItem: c,
  onRefresh,
  showActions = true,
  showQueue = false,
}: Props) {
  const queue = queueMeta(c.queue);
  const qualPill = getQualificationPill(c.qualificationTier, c.formCompleted);
  const badges = pickCaseBadges(c, showQueue, queue, qualPill);
  const due = dueLabel(c.nextActionDueAt);
  const isUrgent = c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK";
  const isNn = isNeuronourishVertical();
  const nnMeta = isNn ? nnCaseCardMeta(c.lead) : null;
  const showRevenue =
    isNn && nnMeta?.showRevenue
      ? true
      : c.queue === "APPLICATION" || c.queue === "COMPLETION";
  const created =
    c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt);

  return (
    <article
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border border-slate-200 border-l-4 bg-white shadow-sm transition hover:shadow-md",
        slaAccentBorder(c.slaStatus),
      )}
    >
      <Link
        href={`/workspace/cases/${c.caseId}`}
        className="absolute inset-0 z-0 rounded-lg"
        aria-label={`Open case for ${c.borrowerName}`}
      />
      <div className="pointer-events-none relative z-10 p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="inline-flex min-w-0 items-center gap-0.5 text-sm font-semibold text-navy group-hover:text-gold-ink">
                <span className="truncate">{c.borrowerName}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
              </span>
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-600">
              {isNn && nnMeta ? (
                <>
                  <span className="font-semibold text-navy">{nnMeta.headline}</span>
                  {nnMeta.subline ? (
                    <>
                      {" · "}
                      <span>{nnMeta.subline}</span>
                    </>
                  ) : null}
                  {" · "}
                  <span>{attributionSummary(c.lead)}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-navy">{formatCurrency(c.loanAmount)}</span>
                  {" · "}
                  <span className="capitalize">{c.purpose.replace(/_/g, " ").toLowerCase()}</span>
                  {" · "}
                  <span>{attributionSummary(c.lead)}</span>
                </>
              )}
              {c.priorityCallSlot && (
                <span className="text-violet-700"> · 📞 {c.priorityCallSlot}</span>
              )}
              {showRevenue && (
                <span className="text-emerald-700">
                  {" · "}
                  <PoundSterling className="mr-0.5 inline h-3 w-3" />
                  {isNn && nnMeta?.revenueLabel
                    ? nnMeta.revenueLabel
                    : formatCurrency(c.expectedValue)}
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <ArrowRight className="h-3 w-3 shrink-0 text-gold" aria-hidden />
              <span className="font-semibold text-navy">{c.nextAction}</span>
              {due && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold",
                    isUrgent ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600",
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {due}
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 text-right text-[10px] leading-tight text-slate-400">
            <span className="block">{c.owner}</span>
            <span>{formatCardDate(created)}</span>
            {c.responseTimeMinutes != null && (
              <span className="block text-emerald-600">{c.responseTimeMinutes}m rsp</span>
            )}
          </span>
        </div>
      </div>

      {showActions && <CaseCardFooter caseItem={c} onRefresh={onRefresh} />}
    </article>
  );
}

export function CaseCardList({
  cases,
  onRefresh,
  emptyMessage = "Nothing here right now.",
  showQueue,
}: {
  cases: CaseView[];
  onRefresh?: () => void;
  emptyMessage?: string;
  showQueue?: boolean;
}) {
  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <CaseCard
          key={c.caseId}
          caseItem={c}
          onRefresh={onRefresh}
          showQueue={showQueue}
        />
      ))}
    </div>
  );
}
