"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Mail, Search, Upload } from "lucide-react";
import { CaseCard } from "@/components/workspace/case-card";
import { SequenceImportWizard } from "@/components/workspace/sequence-import-wizard";
import { useOperationalData } from "@/components/workspace/use-operational-data";
import { WINBACK_STANDARD_SCHEDULE } from "@/lib/winback-schedule";
import { computeWinbackMetrics } from "@/lib/winback-metrics";
import { formatCurrency } from "@/lib/utils";
import {
  caseInReengagementQueue,
  isWinbackDueToday,
} from "@/lib/workspace-case";
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspacePageHeader,
  WorkspaceRefreshButton,
  WorkspaceSkeletonCards,
  WorkspaceStatPills,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-ui";
import { Button } from "@/components/ui/button";

type ReengagementChip = "all" | "due-today" | "paused" | "imported";

const CHIP_LABELS: Record<ReengagementChip, string> = {
  all: "All enrolled",
  "due-today": "Due today",
  paused: "Paused",
  imported: "Imported",
};

type ImportBatchRow = {
  id: string;
  campaign: string;
  enrolled: number;
  status: string;
  createdAt: string;
};

export function ReengagementBoard() {
  const { data, loading, error, reload } = useOperationalData();
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<ReengagementChip>("all");
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [batches, setBatches] = useState<ImportBatchRow[]>([]);

  const enrolled = useMemo(
    () => (data?.cases ?? []).filter((c) => caseInReengagementQueue(c)),
    [data?.cases],
  );

  const importCampaigns = useMemo(() => {
    const campaigns = new Set<string>();
    for (const c of enrolled) {
      const campaign = c.lead.importCampaign;
      if (campaign) campaigns.add(campaign);
      else if (c.lead.source === "csv_import") campaigns.add("csv_import");
    }
    return [...campaigns].sort();
  }, [enrolled]);

  useEffect(() => {
    void fetch("/api/workspace/import-batches")
      .then((r) => r.json())
      .then((json: { batches?: ImportBatchRow[] }) => setBatches(json.batches ?? []))
      .catch(() => setBatches([]));
  }, [importOpen, loading]);

  const filtered = useMemo(() => {
    let list = enrolled;
    if (chip === "due-today") {
      list = list.filter((c) => isWinbackDueToday(c));
    } else if (chip === "paused") {
      list = list.filter((c) => c.lead.winbackStatus === "paused");
    } else if (chip === "imported") {
      list = list.filter((c) => c.lead.source === "csv_import" || Boolean(c.lead.importBatchId));
    } else {
      list = list.filter((c) => c.lead.winbackStatus === "active");
    }
    if (campaignFilter) {
      list = list.filter(
        (c) =>
          c.lead.importCampaign === campaignFilter ||
          (campaignFilter === "csv_import" && c.lead.source === "csv_import"),
      );
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
    return [...list].sort((a, b) => {
      const aDue = a.lead.winbackNextAt?.getTime() ?? Infinity;
      const bDue = b.lead.winbackNextAt?.getTime() ?? Infinity;
      return aDue - bDue;
    });
  }, [enrolled, chip, search, campaignFilter]);

  const chipCounts = useMemo(
    () => ({
      all: enrolled.filter((c) => c.lead.winbackStatus === "active").length,
      "due-today": enrolled.filter((c) => isWinbackDueToday(c)).length,
      paused: enrolled.filter((c) => c.lead.winbackStatus === "paused").length,
      imported: enrolled.filter(
        (c) => c.lead.source === "csv_import" || Boolean(c.lead.importCampaign),
      ).length,
    }),
    [enrolled],
  );

  const metrics = useMemo(
    () => computeWinbackMetrics((data?.cases ?? []).map((c) => c.lead)),
    [data?.cases],
  );

  const totalSteps = WINBACK_STANDARD_SCHEDULE.length;

  return (
    <div className="p-4 md:p-8">
      <WorkspacePageHeader
        title="Re-engagement"
        description="Lost leads on an active win-back email sequence"
        icon={Mail}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-gold/40 text-navy"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import CSV
            </Button>
            <WorkspaceRefreshButton loading={loading} onClick={() => void reload()} />
          </div>
        }
      >
        <WorkspaceStatPills
          items={[
            { label: "Active", value: metrics.active },
            { label: "Due today", value: metrics.dueToday, tone: "text-amber-700" },
            { label: "Paused", value: metrics.paused },
            { label: "Completed", value: metrics.completed },
            { label: "Re-engaged", value: metrics.reEngaged, tone: "text-emerald-700" },
          ]}
        />
      </WorkspacePageHeader>

      {error && <WorkspaceErrorState message={error} onRetry={() => void reload()} />}

      <WorkspaceToolbar>
        <div className="relative min-w-[200px] flex-1">
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
      </WorkspaceToolbar>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(CHIP_LABELS) as ReengagementChip[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setChip(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              chip === key
                ? "bg-navy text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {CHIP_LABELS[key]}
            {chipCounts[key] > 0 ? ` (${chipCounts[key]})` : ""}
          </button>
        ))}
      </div>

      {importCampaigns.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCampaignFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              campaignFilter == null
                ? "bg-navy text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            All campaigns
          </button>
          {importCampaigns.map((campaign) => (
            <button
              key={campaign}
              type="button"
              onClick={() => setCampaignFilter(campaign)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                campaignFilter === campaign
                  ? "bg-navy text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {campaign}
            </button>
          ))}
        </div>
      )}

      {batches.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="mb-2 font-semibold text-navy">Recent imports</p>
          <ul className="space-y-1 text-slate-600">
            {batches.slice(0, 5).map((batch) => (
              <li key={batch.id}>
                {batch.campaign} — {batch.enrolled} enrolled · {batch.status} ·{" "}
                {format(new Date(batch.createdAt), "d MMM yyyy HH:mm")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && enrolled.length === 0 && !error ? (
        <WorkspaceSkeletonCards count={3} />
      ) : filtered.length === 0 && !error ? (
        <WorkspaceEmptyState
          title="No win-back sequences"
          description="Enroll lost leads from case detail when marking as lost, or from a closed case."
          action={
            <Link href="/workspace/closed" className="text-sm font-semibold text-gold-ink hover:underline">
              View lost / disqualified →
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.caseId} className="relative">
              <CaseCard caseItem={c} onRefresh={reload} />
              <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
                {(c.lead.source === "csv_import" || c.lead.importBatchId) && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Imported
                  </span>
                )}
              </div>
              <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-white/95 px-3 py-2 text-right text-xs shadow-sm ring-1 ring-slate-200">
                <p className="font-semibold text-navy">
                  Step {c.lead.winbackStep}/{totalSteps}
                  {c.lead.winbackStatus === "paused" ? " · Paused" : ""}
                </p>
                <p className="text-slate-500">
                  {c.lead.winbackNextAt
                    ? `Next: ${format(c.lead.winbackNextAt, "d MMM")}`
                    : "Next: —"}
                </p>
                <p className="text-slate-500">{formatCurrency(c.loanAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <SequenceImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={() => void reload()}
      />
    </div>
  );
}
