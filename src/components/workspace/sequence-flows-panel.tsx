"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  PauseCircle,
  StopCircle,
  Upload,
  Zap,
} from "lucide-react";
import { SequenceImportWizard } from "@/components/workspace/sequence-import-wizard";
import { Button } from "@/components/ui/button";
import type {
  SequenceFlowFunnel,
  SequenceFunnelOverview,
} from "@/lib/sequence-funnel-stats";
import {
  WorkspaceErrorState,
  WorkspaceRefreshButton,
  WorkspaceSkeletonCards,
  WorkspaceStatPills,
} from "@/components/workspace/workspace-ui";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";
import { cn, formatDate } from "@/lib/utils";

const AUTO_REFRESH_MS = 60_000;

function ChannelIcon({ channel }: { channel: "email" | "sms" }) {
  if (channel === "sms") {
    return <MessageSquare className="h-4 w-4 text-violet-600" />;
  }
  return <Mail className="h-4 w-4 text-emerald-600" />;
}

function FlowConnector({ waitLabel }: { waitLabel: string | null }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-5 w-px bg-slate-300" />
      {waitLabel && (
        <div className="my-1 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
          <Clock className="h-3 w-3" />
          {waitLabel}
        </div>
      )}
      <div className="h-5 w-px bg-slate-300" />
    </div>
  );
}

function FunnelProgressBar({ flow }: { flow: SequenceFlowFunnel }) {
  const total = flow.steps.reduce((s, step) => s + step.waiting + step.paused, 0);
  if (total === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-medium text-slate-500">Leads by next step</p>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-200">
        {flow.steps.map((step) => {
          const count = step.waiting + step.paused;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={step.step}
              title={`Step ${step.step}: ${count}`}
              className={cn(
                "h-full min-w-[4px]",
                step.paused > 0 && step.waiting === 0 ? "bg-amber-400" : "bg-gold",
              )}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepNode({
  step,
  channel,
  label,
  day,
  waiting,
  paused,
  passed,
  dueToday,
  nextDueAt,
  leads,
  leadsOverflow,
}: {
  step: number;
  channel: "email" | "sms";
  label: string;
  day: number;
  waiting: number;
  paused: number;
  passed: number;
  dueToday: number;
  nextDueAt: string | null;
  leads: Array<{ id: string; name: string; dueAt: string | null; status: "waiting" | "paused" }>;
  leadsOverflow: number;
}) {
  const total = waiting + paused;
  const hasLeads = total > 0;

  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-xl border bg-white p-4 shadow-sm",
        hasLeads ? "border-gold/50 ring-1 ring-gold/25" : "border-slate-200",
        dueToday > 0 && "border-amber-300 ring-amber-200/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            channel === "sms" ? "bg-violet-50" : "bg-emerald-50",
          )}
        >
          <ChannelIcon channel={channel} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Step {step}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Day {day}
            </span>
            {channel === "sms" && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                SMS
              </span>
            )}
            {dueToday > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                {dueToday} due today
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium leading-snug text-navy">{label}</p>
          {nextDueAt && waiting > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Next send {formatDate(nextDueAt)}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-3xl font-bold tabular-nums leading-none",
              waiting > 0 ? "text-navy" : "text-slate-300",
            )}
          >
            {waiting}
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            waiting
          </p>
          {paused > 0 && (
            <p className="mt-1 flex items-center justify-end gap-0.5 text-[10px] font-medium text-amber-700">
              <PauseCircle className="h-3 w-3" />
              {paused} paused
            </p>
          )}
          {passed > 0 && (
            <p className="mt-1 text-[10px] text-slate-500">{passed} passed</p>
          )}
        </div>
      </div>

      {leads.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {leads.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between gap-2">
              <Link
                href={`/workspace/cases/${lead.id}`}
                className="text-xs font-medium text-slate-700 underline-offset-2 hover:text-navy hover:underline"
              >
                {lead.name}
              </Link>
              <span className="flex shrink-0 items-center gap-2 text-[10px] text-slate-400">
                {lead.status === "paused" && (
                  <span className="text-amber-700">paused</span>
                )}
                {lead.dueAt && <span>{formatDate(lead.dueAt)}</span>}
              </span>
            </li>
          ))}
          {leadsOverflow > 0 && (
            <li className="text-[10px] font-medium text-slate-400">
              +{leadsOverflow} more at this step
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function ExitNode({
  kind,
  count,
  leads,
}: {
  kind: "completed" | "stopped";
  count: number;
  leads: Array<{ id: string; name: string }>;
}) {
  const isCompleted = kind === "completed";
  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-xl border p-4",
        isCompleted
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex items-center gap-3">
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <StopCircle className="h-5 w-5 text-slate-500" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy">
            {isCompleted ? "Completed sequence" : "Stopped / exited"}
          </p>
          <p className="text-2xl font-bold tabular-nums text-navy">{count}</p>
        </div>
      </div>
      {leads.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-white/60 pt-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/workspace/cases/${lead.id}`}
                className="text-xs text-slate-600 hover:text-navy hover:underline"
              >
                {lead.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SequenceFlowCard({ flow }: { flow: SequenceFlowFunnel }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">{flow.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{flow.description}</p>
        </div>
        {flow.queueHref && flow.active + flow.paused > 0 && (
          <Link
            href={flow.queueHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy shadow-sm hover:bg-slate-50"
          >
            Open queue
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <WorkspaceStatPills
        items={[
          { label: "Enrolled", value: flow.enrolled },
          { label: "Active", value: flow.active, tone: "text-emerald-700" },
          { label: "Due today", value: flow.dueToday, tone: "text-amber-700" },
          { label: "Paused", value: flow.paused, tone: "text-amber-700" },
          { label: "Completed", value: flow.completed },
          { label: "Stopped", value: flow.stopped, tone: "text-slate-500" },
        ]}
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6">
        <FunnelProgressBar flow={flow} />

        <div className="flex flex-col items-center">
          <div className="w-full max-w-lg rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Trigger
                </p>
                <p className="mt-0.5 text-sm font-semibold text-navy">{flow.trigger}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {flow.triggerDetail}
                </p>
                <p className="mt-2 text-sm font-bold tabular-nums text-navy">
                  {flow.enrolled}{" "}
                  <span className="text-xs font-normal text-slate-500">total enrolled</span>
                </p>
              </div>
            </div>
          </div>

          {flow.steps.map((step, index) => (
            <div key={`${flow.id}-${step.step}`} className="flex w-full flex-col items-center">
              <FlowConnector waitLabel={step.waitLabel} />
              <StepNode
                step={step.step}
                channel={step.channel}
                label={step.label}
                day={step.day}
                waiting={step.waiting}
                paused={step.paused}
                passed={step.passed}
                dueToday={step.dueToday}
                nextDueAt={step.nextDueAt}
                leads={step.leads}
                leadsOverflow={step.leadsOverflow}
              />
              {index === flow.steps.length - 1 && (
                <>
                  <FlowConnector waitLabel={null} />
                  <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
                    <ExitNode
                      kind="completed"
                      count={flow.completed}
                      leads={flow.completedLeads}
                    />
                    <ExitNode kind="stopped" count={flow.stopped} leads={flow.stoppedLeads} />
                  </div>
                </>
              )}
            </div>
          ))}

          {flow.enrolled === 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">
              No leads enrolled on this sequence yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function pickDefaultFlowId(flows: SequenceFlowFunnel[]): string {
  const withActive = flows.find((f) => f.active > 0 || f.paused > 0);
  return withActive?.id ?? flows[0]?.id ?? "";
}

export function SequenceFlowsPanel() {
  const [flows, setFlows] = useState<SequenceFlowFunnel[]>([]);
  const [overview, setOverview] = useState<SequenceFunnelOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/workspace/sequences");
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = (await res.json()) as {
        flows: SequenceFlowFunnel[];
        overview: SequenceFunnelOverview;
        updatedAt: string;
      };
      setFlows(data.flows);
      setOverview(data.overview);
      setUpdatedAt(data.updatedAt);
      setSelectedId((prev) => {
        if (prev && data.flows.some((f) => f.id === prev)) return prev;
        return pickDefaultFlowId(data.flows);
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => void load(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const selectedFlow = useMemo(
    () => flows.find((f) => f.id === selectedId) ?? flows[0],
    [flows, selectedId],
  );

  if (loading) {
    return <WorkspaceSkeletonCards count={2} />;
  }

  if (error) {
    return <WorkspaceErrorState message="Could not load sequence flows." onRetry={load} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Sequence flows</h1>
          <p className="mt-1 text-sm text-slate-500">
            GHL-style pipeline view — see where each lead sits. Read-only; refreshes every minute.
          </p>
          {updatedAt && (
            <p className="mt-2 text-xs text-slate-400">
              Updated {new Date(updatedAt).toLocaleString("en-GB")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {selectedFlow &&
            (selectedFlow.id === WINBACK_SEQUENCE_ID ||
              selectedFlow.id === WINBACK_LONG_SEQUENCE_ID) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-gold/40"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Import CSV
              </Button>
            )}
          <WorkspaceRefreshButton onClick={load} />
        </div>
      </div>

      {overview && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            All sequences
          </p>
          <WorkspaceStatPills
            items={[
              { label: "Enrolled", value: overview.totalEnrolled },
              { label: "Active", value: overview.totalActive, tone: "text-emerald-700" },
              { label: "Due today", value: overview.totalDueToday, tone: "text-amber-700" },
              { label: "Paused", value: overview.totalPaused, tone: "text-amber-700" },
              { label: "Completed", value: overview.totalCompleted },
            ]}
          />
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        {flows.map((flow) => {
          const active = flow.active + flow.paused;
          const selected = flow.id === selectedId;
          return (
            <button
              key={flow.id}
              type="button"
              onClick={() => setSelectedId(flow.id)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                selected
                  ? "border-navy bg-navy text-white shadow-md"
                  : "border-slate-200 bg-white text-navy hover:border-slate-300",
              )}
            >
              <p className="text-sm font-semibold">{flow.name}</p>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  selected ? "text-slate-300" : "text-slate-500",
                )}
              >
                {active > 0 ? (
                  <>
                    <span className="font-bold tabular-nums">{active}</span> in progress
                  </>
                ) : (
                  "No active leads"
                )}
              </p>
            </button>
          );
        })}
      </div>

      {selectedFlow ? (
        <SequenceFlowCard flow={selectedFlow} />
      ) : (
        <p className="text-slate-500">No sequences configured.</p>
      )}

      <p className="mt-10 flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          <strong>Waiting</strong> = next scheduled send is this step.{" "}
          <strong>Passed</strong> = already received this step or beyond.{" "}
          <strong>Due today</strong> uses Europe/London. Change enrollments from the case
          detail page — this view is monitoring only.
        </span>
      </p>

      <SequenceImportWizard
        open={importOpen}
        initialSequenceId={selectedFlow?.id}
        onClose={() => setImportOpen(false)}
        onComplete={load}
      />
    </div>
  );
}
