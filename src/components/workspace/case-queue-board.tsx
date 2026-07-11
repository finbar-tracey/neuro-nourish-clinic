"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  FileText,
  Landmark,
  Phone,
  Search,
  Trophy,
} from "lucide-react";
import { CaseCard } from "@/components/workspace/case-card";
import { useOperationalData } from "@/components/workspace/use-operational-data";
import { stageLabel } from "@/lib/case-stages";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import { formatEur } from "@/lib/neuronourish-workspace";
import { formatCurrency } from "@/lib/utils";
import {
  caseInQueuePage,
  countFilterChip,
  dedupeCasesById,
  filterCasesByChip,
  sortCasesByUrgency,
  stagesInCases,
  type QueueFilterChip,
  type QueuePageId,
} from "@/lib/workspace-case";
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceFilterChips,
  WorkspacePageHeader,
  WorkspaceRefreshButton,
  WorkspaceSkeletonCards,
  WorkspaceStatPills,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-ui";

const QUEUE_PAGES: Record<
  QueuePageId,
  { title: string; description: string; icon: typeof Phone; tone: "violet" | "amber" | "blue" | "green" | "red" | "neutral" }
> = {
  callbacks: {
    title: "Follow-Up",
    description: "Active deals — stays here until initial invoice is paid",
    icon: Phone,
    tone: "violet",
  },
  documents: {
    title: "Awaiting Documents",
    description: "Documents requested but not yet complete",
    icon: FileText,
    tone: "amber",
  },
  applications: {
    title: "Applications",
    description: "Documents received through lender submission",
    icon: Landmark,
    tone: "blue",
  },
  completions: {
    title: "Completed",
    description: "Initial invoice paid — automations stopped",
    icon: Trophy,
    tone: "green",
  },
  closed: {
    title: "Lost / Disqualified",
    description: "Closed cases kept for reference and reporting",
    icon: Archive,
    tone: "neutral",
  },
  "at-risk": {
    title: "At Risk",
    description: "Overdue SLAs and cases needing urgent attention",
    icon: AlertTriangle,
    tone: "red",
  },
};

function queuePageMeta(queueId: QueuePageId) {
  if (isNeuronourishVertical()) {
    const nn: Partial<typeof QUEUE_PAGES> = {
      callbacks: {
        title: "Follow-up",
        description: "Discovery calls and conversations until assessment or enrolment",
        icon: Phone,
        tone: "violet",
      },
      applications: {
        title: "Assessments",
        description: "CNS assessment purchased — clinician summary pending",
        icon: FileText,
        tone: "blue",
      },
      completions: {
        title: "Enrolled",
        description: "12-month programme clients — onboarding in progress or active",
        icon: Trophy,
        tone: "green",
      },
      closed: {
        title: "Lost / disqualified",
        description: "Closed enquiries kept for reporting",
        icon: Archive,
        tone: "neutral",
      },
      "at-risk": {
        title: "At risk",
        description:
          "Overdue or high-risk enquiries — still listed in New enquiries or Follow-up; this view filters for urgency",
        icon: AlertTriangle,
        tone: "red",
      },
    };
    return nn[queueId] ?? QUEUE_PAGES[queueId];
  }
  return QUEUE_PAGES[queueId];
}

export function CaseQueueBoard({ queueId }: { queueId: string }) {
  const pageId = (queueId in QUEUE_PAGES ? queueId : "callbacks") as QueuePageId;
  const meta = queuePageMeta(pageId);
  const { data, loading, error, reload } = useOperationalData();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [urgencyChip, setUrgencyChip] = useState<QueueFilterChip>("all");

  const cases = useMemo(
    () => dedupeCasesById((data?.cases ?? []).filter((c) => caseInQueuePage(c, pageId))),
    [data?.cases, pageId],
  );

  const filtered = useMemo(() => {
    let list = cases;
    if (stageFilter !== "all") {
      list = list.filter((c) => c.stage === stageFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.borrowerName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }
    list = filterCasesByChip(list, urgencyChip);
    if (pageId === "closed") {
      return [...list].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    return sortCasesByUrgency(list);
  }, [cases, search, stageFilter, urgencyChip]);

  const chipCounts = useMemo(
    () => ({
      all: countFilterChip(cases, "all"),
      overdue: countFilterChip(cases, "overdue"),
      "due-today": countFilterChip(cases, "due-today"),
    }),
    [cases],
  );

  const stagesInQueue = useMemo(() => stagesInCases(cases), [cases]);

  const isNn = isNeuronourishVertical();

  const expectedRevenue = useMemo(
    () => filtered.reduce((sum, c) => sum + c.expectedValue, 0),
    [filtered],
  );

  const overdueCount = useMemo(
    () => filtered.filter((c) => c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK").length,
    [filtered],
  );

  const Icon = meta.icon;

  return (
    <div className="p-4 md:p-8">
      <WorkspacePageHeader
        title={meta.title}
        description={meta.description}
        icon={Icon}
        action={<WorkspaceRefreshButton loading={loading} onClick={() => void reload()} />}
      >
        <WorkspaceStatPills
          items={[
            { label: "Cases", value: filtered.length },
            {
              label: "Expected revenue",
              value: isNn ? formatEur(expectedRevenue) : formatCurrency(expectedRevenue),
            },
            ...(overdueCount > 0
              ? [{ label: "Overdue", value: overdueCount, tone: "text-red-700" }]
              : []),
          ]}
        />
      </WorkspacePageHeader>

      {error && <WorkspaceErrorState message={error} onRetry={() => void reload()} />}

      <WorkspaceToolbar className="flex-col sm:flex-row sm:items-center">
        <div className="relative w-full flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search cases…"
            aria-label="Search cases by name, phone, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:w-auto"
        >
          <option value="all">All stages</option>
          {stagesInQueue.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </select>
      </WorkspaceToolbar>

      <div className="mb-4">
        <WorkspaceFilterChips value={urgencyChip} onChange={setUrgencyChip} counts={chipCounts} />
      </div>

      {loading && cases.length === 0 && !error ? (
        <WorkspaceSkeletonCards count={4} />
      ) : filtered.length === 0 && !error ? (
        <WorkspaceEmptyState
          title="No cases in this queue"
          description="Cases appear here as they move through this stage of the pipeline."
          action={
            <Link href="/workspace" className="text-sm font-semibold text-gold-ink hover:underline">
              ← Back to command centre
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <CaseCard key={c.caseId} caseItem={c} onRefresh={reload} />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="mt-8 text-center text-xs text-slate-400">
          <Link href="/workspace" className="font-medium hover:text-gold-ink">
            ← Back to command centre
          </Link>
        </p>
      )}
    </div>
  );
}
