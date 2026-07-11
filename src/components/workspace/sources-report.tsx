"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { formatEur } from "@/lib/neuronourish-workspace";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import {
  WorkspaceEmptyState,
  WorkspaceKpiCard,
  WorkspacePageHeader,
  WorkspaceRefreshButton,
} from "@/components/workspace/workspace-ui";

function money(cents: number) {
  return isNeuronourishVertical() ? formatEur(cents) : new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
type SourceRow = {
  source: string;
  leads: number;
  consultations: number;
  documentsRequested: number;
  applications: number;
  completed: number;
  consultationRate: number;
  completedRate: number;
  conversionRate: number;
  expectedRevenue: number;
  revenueGenerated: number;
};

type CampaignRow = {
  channel: string;
  campaign: string;
  leads: number;
  consultations: number;
  consultationRate: number;
  completedRate: number;
  expectedRevenue: number;
  revenueGenerated: number;
};

export function SourcesReport() {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/sources");
      const d = (await res.json()) as { rows: SourceRow[]; campaigns?: CampaignRow[] };
      setRows(d.rows);
      setCampaigns(d.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("workspace:refresh", onRefresh);
    return () => window.removeEventListener("workspace:refresh", onRefresh);
  }, [load]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          leads: acc.leads + row.leads,
          consultations: acc.consultations + row.consultations,
          documentsRequested: acc.documentsRequested + row.documentsRequested,
          applications: acc.applications + row.applications,
          completed: acc.completed + row.completed,
          expectedRevenue: acc.expectedRevenue + row.expectedRevenue,
          revenueGenerated: acc.revenueGenerated + row.revenueGenerated,
        }),
        {
          leads: 0,
          consultations: 0,
          documentsRequested: 0,
          applications: 0,
          completed: 0,
          expectedRevenue: 0,
          revenueGenerated: 0,
        },
      ),
    [rows],
  );

  const avgConversion =
    totals.leads > 0 ? Math.round((totals.consultations / totals.leads) * 100) : 0;

  const maxLeads = Math.max(...rows.map((r) => r.leads), 1);

  const topSource = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows].sort((a, b) => b.revenueGenerated - a.revenueGenerated || b.leads - a.leads)[0];
  }, [rows]);

  return (
    <div className="p-4 md:p-8">
      <WorkspacePageHeader
        title="Source attribution"
        description="Which channels are driving consultations, applications, and revenue."
        icon={BarChart3}
        action={<WorkspaceRefreshButton loading={loading} onClick={() => void load()} />}
      />

      {rows.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <WorkspaceKpiCard label="Total leads" value={totals.leads} tone="blue" />
          <WorkspaceKpiCard
            label="Consultations"
            value={totals.consultations}
            sub={`${avgConversion}% lead → call`}
            tone="violet"
          />
          <WorkspaceKpiCard label="Applications" value={totals.applications} tone="orange" />
          <WorkspaceKpiCard
            label="Revenue generated"
            value={money(totals.revenueGenerated)}
            sub={`${money(totals.expectedRevenue)} pipeline`}
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            tone="green"
          />
        </div>
      )}

      {topSource && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Top performer
          </p>
          <p className="mt-1 text-lg font-bold text-navy">{topSource.source}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topSource.leads} leads · {topSource.consultationRate}% lead → call ·{" "}
            {topSource.completedRate}% completed ·{" "}
            <span className="font-semibold text-emerald-800">
              {money(topSource.revenueGenerated || topSource.expectedRevenue)}
            </span>{" "}
            revenue generated
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading attribution data…</p>
      ) : rows.length === 0 ? (
        <WorkspaceEmptyState
          title="No source data yet"
          description="Source breakdown appears once leads are captured with attribution."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div
                key={row.source}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-navy">{row.source}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.conversionRate >= 40
                        ? "bg-emerald-100 text-emerald-800"
                        : row.conversionRate >= 20
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.conversionRate}%
                  </span>
                  <p className="mt-0.5 text-[10px] text-slate-400">lead → call</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-navy">{row.leads}</p>
                    <p className="text-slate-500">Leads</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy">{row.consultations}</p>
                    <p className="text-slate-500">Calls</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800">
                      {money(row.revenueGenerated || row.expectedRevenue)}
                    </p>
                    <p className="text-slate-500">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Leads</th>
                  <th className="px-4 py-3">Consultations</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Apps</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Lead → call</th>
                  <th className="px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.source}
                    className="border-b border-slate-50 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{row.source}</div>
                      <div className="mt-1.5 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.leads}</td>
                    <td className="px-4 py-3">{row.consultations}</td>
                    <td className="px-4 py-3">{row.documentsRequested}</td>
                    <td className="px-4 py-3">{row.applications}</td>
                    <td className="px-4 py-3">{row.completed}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.conversionRate >= 40
                            ? "bg-emerald-100 text-emerald-800"
                            : row.conversionRate >= 20
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.conversionRate}%
                      </span>
                      <p className="mt-0.5 text-[10px] font-normal text-slate-400">consultation</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-800">
                      {money(row.expectedRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-navy">
                <tr>
                  <td className="px-4 py-3">All sources</td>
                  <td className="px-4 py-3">{totals.leads}</td>
                  <td className="px-4 py-3">{totals.consultations}</td>
                  <td className="px-4 py-3">{totals.documentsRequested}</td>
                  <td className="px-4 py-3">{totals.applications}</td>
                  <td className="px-4 py-3">{totals.completed}</td>
                  <td className="px-4 py-3">{avgConversion}%</td>
                  <td className="px-4 py-3 text-emerald-800">
                    {money(totals.expectedRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {campaigns.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-navy">Campaigns & ad angles</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Campaign / angle</th>
                      <th className="px-4 py-3">Leads</th>
                      <th className="px-4 py-3">Calls</th>
                      <th className="px-4 py-3">Lead → call</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((row) => (
                      <tr
                        key={`${row.channel}-${row.campaign}`}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-4 py-3">{row.channel}</td>
                        <td className="px-4 py-3 font-medium text-navy">{row.campaign}</td>
                        <td className="px-4 py-3">{row.leads}</td>
                        <td className="px-4 py-3">{row.consultations}</td>
                        <td className="px-4 py-3">{row.consultationRate}%</td>
                        <td className="px-4 py-3 font-medium text-emerald-800">
                          {money(row.expectedRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
