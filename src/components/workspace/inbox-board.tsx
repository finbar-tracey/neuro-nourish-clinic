"use client";

import { useMemo, useState } from "react";
import { CaseCard } from "@/components/workspace/case-card";
import { useOperationalData } from "@/components/workspace/use-operational-data";
import { formatResponseTime } from "@/lib/speed-to-lead";
import {
  caseInOperationalQueue,
  countFilterChip,
  dedupeCasesById,
  filterCasesByChip,
  sortCasesByUrgency,
  type QueueFilterChip,
} from "@/lib/workspace-case";
import {
  WorkspaceErrorState,
  WorkspaceFilterChips,
  WorkspaceKpiCard,
  WorkspacePageHeader,
  WorkspaceRefreshButton,
  WorkspaceSkeletonCards,
} from "@/components/workspace/workspace-ui";
import { Inbox, Search } from "lucide-react";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import { nnInboxDescription } from "@/lib/neuronourish-workspace";

export function InboxBoard() {
  const { data, loading, error, reload } = useOperationalData();
  const [search, setSearch] = useState("");
  const [urgencyChip, setUrgencyChip] = useState<QueueFilterChip>("all");

  const cases = useMemo(
    () =>
      dedupeCasesById(
        (data?.cases ?? []).filter((c) => caseInOperationalQueue(c, "NEW_LEAD")),
      ),
    [data?.cases],
  );
  const pulse = data?.pulse ?? null;

  const chipCounts = useMemo(
    () => ({
      all: countFilterChip(cases, "all"),
      overdue: countFilterChip(cases, "overdue"),
      "due-today": countFilterChip(cases, "due-today"),
    }),
    [cases],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortCasesByUrgency(
      filterCasesByChip(cases, urgencyChip).filter((c) => {
        if (!q) return true;
        return (
          c.borrowerName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.attributionChannel ?? "").toLowerCase().includes(q)
        );
      }),
    );
  }, [cases, search, urgencyChip]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <WorkspacePageHeader
        title={isNeuronourishVertical() ? "New enquiries" : "New Leads"}
        description={
          isNeuronourishVertical()
            ? nnInboxDescription()
            : "Qualified leads needing first contact — Emer is notified by SMS when they arrive."
        }
        icon={Inbox}
        action={<WorkspaceRefreshButton loading={loading} onClick={() => void reload()} />}
      />

      {error && <WorkspaceErrorState message={error} onRetry={() => void reload()} />}

      {pulse && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <WorkspaceKpiCard label="New leads" value={pulse.uncontactedNew} tone="orange" />
          <WorkspaceKpiCard
            label="Avg response today"
            value={
              pulse.avgResponseMinutes != null
                ? formatResponseTime(pulse.avgResponseMinutes)
                : "—"
            }
            sub="Target: < 15 mins"
            tone="neutral"
          />
          <WorkspaceKpiCard label="Enquiries today" value={pulse.newEnquiriesToday} />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {filtered.length} qualified lead{filtered.length === 1 ? "" : "s"} to call
        </p>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases…"
            aria-label="Search cases by name, phone, or email"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-base focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 md:text-sm"
          />
        </div>
      </div>

      <div className="mb-4">
        <WorkspaceFilterChips value={urgencyChip} onChange={setUrgencyChip} counts={chipCounts} />
      </div>

      <div className="space-y-2">
        {loading && cases.length === 0 && !error && <WorkspaceSkeletonCards count={4} />}
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No new leads right now.
          </div>
        )}
        {filtered.map((c) => (
          <CaseCard key={c.caseId} caseItem={c} onRefresh={reload} showQueue />
        ))}
      </div>
    </div>
  );
}
