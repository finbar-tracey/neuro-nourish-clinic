"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { CaseDetailMobileBar } from "@/components/workspace/case-detail-mobile-bar";
import { LeadActivityTimeline } from "@/components/workspace/lead-activity-timeline";
import { LeadContactActions } from "@/components/workspace/lead-contact-actions";
import type { Lead } from "@/generated/prisma/client";
import {
  computeSlaStatus,
  slaBadgeClasses,
  slaStatusLabel,
} from "@/lib/case";
import { LOST_REASONS, DISQUALIFIED_REASONS, stageLabel, riskLabel } from "@/lib/case-stages";
import { canEnrollWinback, suggestWinbackForLostReason } from "@/lib/winback-eligibility";
import { resolveWinbackSchedule, winbackScheduleSummary } from "@/lib/winback-schedule";
import { BRIDGING_DOCUMENT_TEMPLATE } from "@/lib/document-checklist";
import { LOAN_PURPOSES, PROPERTY_TYPES, TIMEFRAMES } from "@/lib/validations";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { formatUKPhoneDisplay } from "@/lib/form-validation";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { AttributionPanel } from "@/components/workspace/attribution-panel";
import { FollowUpPicker } from "@/components/workspace/follow-up-picker";
import {
  CaseDetailNnHeaderMeta,
  CaseDetailNnJourney,
  CaseDetailNnSummary,
  nnDisqualifiedReasonOptions,
  nnLostReasonOptions,
} from "@/components/workspace/case-detail-nn";
import { ClinicalDashboardGrid } from "@/components/workspace/clinical-dashboard-grid";
import { WorkspaceCredentialStatusBlock } from "@/components/workspace/workspace-credential-status-block";
import { CasePrintAction } from "@/components/workspace/case-print-action";
import { WorkspaceDiscoveryScriptPanel } from "@/components/workspace/workspace-discovery-script-panel";
import { funnelStageLabel } from "@/lib/neuronourish-funnel";
import { nnStageLabel } from "@/lib/neuronourish-workspace";
import { isNeuronourishVertical } from "@/lib/vertical-config";

function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type CaseDoc = {
  id: string;
  docKey: string;
  label: string;
  required: boolean;
  status: string;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
};

function documentViewHref(caseId: string, doc: CaseDoc): string | null {
  if (doc.status !== "UPLOADED" && doc.status !== "ACCEPTED") return null;
  if (doc.fileUrl) return doc.fileUrl;
  if (doc.fileName) return `/api/leads/${caseId}/documents/${doc.id}`;
  return null;
}

type CaseData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanPurpose: string;
  loanAmount: number;
  termMonths: number;
  propertyType: string;
  propertyValue: number;
  propertyLocation: string;
  timeframe: string;
  willOccupy: boolean;
  hasEverOccupied: boolean;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  gclid: string | null;
  landingPageUrl: string | null;
  referrer: string | null;
  deviceType: string | null;
  attributionChannel: string | null;
  owner: string;
  operationalQueue: string | null;
  status: string;
  caseStage: string;
  riskLevel: string;
  riskReason: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  callbackDueAt: string | null;
  firstResponseAt: string | null;
  documentsRequestedAt: string | null;
  consultationCompletedAt: string | null;
  conversationStarted: boolean;
  remindersPaused: boolean;
  priorityCallBookedAt: string | null;
  priorityCallSlot: string | null;
  teamsMeetingUrl: string | null;
  estimatedCommission: number | null;
  initialInvoiceAmount: number | null;
  revenueGenerated: number | null;
  bookingChaseEnrolled: boolean;
  bookingChaseStep: number;
  probability: number;
  expectedValue: number | null;
  formCompleted: boolean;
  funnelStage: string;
  quizScore: number | null;
  primaryConcern: string | null;
  segment: string | null;
  qualificationTier: string | null;
  revenueEur: number;
  pipelineValueEur: number;
  creditExpiryDate: string | null;
  assessmentPaidAt: string | null;
  discoveryBookedAt: string | null;
  enrolledAt: string | null;
  credentialsProvisioned: boolean;
  additionalInfo: string | null;
  lostReason: string | null;
  winbackEnrolled: boolean;
  winbackStatus: string | null;
  winbackStep: number;
  winbackNextAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: { id: string; content: string; author: string; createdAt: string }[];
  activities: { id: string; type: string; description: string; createdAt: string }[];
  caseDocuments?: CaseDoc[];
};

export function CaseDetail({ caseId }: { caseId: string }) {
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [docRequestError, setDocRequestError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    BRIDGING_DOCUMENT_TEMPLATE.filter((d) => d.required).map((d) => d.docKey),
  );
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const winbackPreview = useMemo(
    () => (canEnrollWinback(lostReason) ? resolveWinbackSchedule(lostReason) : null),
    [lostReason],
  );
  const [startWinback, setStartWinback] = useState(suggestWinbackForLostReason(LOST_REASONS[0]));
  const [disqReason, setDisqReason] = useState(DISQUALIFIED_REASONS[0]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpMode, setFollowUpMode] = useState<"contact" | "reschedule" | "reopen">("contact");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const closedWinbackSteps = data?.lostReason
    ? resolveWinbackSchedule(data.lostReason).steps.length
    : 0;

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/leads/${caseId}`);
      if (!res.ok) {
        setLoadError(res.status === 404 ? "Case not found" : "Could not load case");
        setData(null);
        return;
      }
      const json = (await res.json()) as CaseData;
      if ("error" in json && (json as { error?: string }).error) {
        setLoadError("Case not found");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setLoadError("Could not load case — check your connection and try again");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [caseId]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/leads/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setActionError(errBody.error ?? "Update failed — try again");
        return;
      }
      window.dispatchEvent(new Event("workspace:counts-changed"));
      await load();
    } catch {
      setActionError("Update failed — try again");
    } finally {
      setSaving(false);
    }
  }

  async function requestDocs() {
    setSaving(true);
    setDocRequestError(null);
    try {
      const res = await fetch(`/api/leads/${caseId}/request-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docKeys: selectedDocs }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setDocRequestError(body.error ?? "Could not send document request — try again");
        return;
      }
      setShowDocModal(false);
      await load();
    } catch {
      setDocRequestError("Could not send document request — try again");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setActionError(null);
    const res = await fetch(`/api/leads/${caseId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    if (!res.ok) {
      setActionError("Could not save note — try again");
      return;
    }
    setNote("");
    await load();
  }

  async function deleteCase() {
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/leads/${caseId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setActionError(body.error ?? "Could not delete case — try again");
        return;
      }
      window.dispatchEvent(new Event("workspace:counts-changed"));
      router.push("/workspace");
      router.refresh();
    } catch {
      setActionError("Could not delete case — try again");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading case…
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="p-4 md:p-8">
        <Link
          href="/workspace"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to command centre
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-800">{loadError ?? "Case not found"}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isNn = isNeuronourishVertical();
  const slaStatus = computeSlaStatus(data as unknown as Lead);
  const label = (opts: readonly { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label ?? v;

  const nnPipelineActions: Array<{ stage: string; label: string }> = [];
  if (isNn) {
    const tier = data.funnelStage ?? data.qualificationTier ?? data.propertyType;
    if (tier === "quiz_completed" || tier === "discovery_requested" || tier === "eoi_submitted") {
      nnPipelineActions.push({ stage: "assessment_purchased", label: "Mark assessment purchased" });
    }
    if (tier === "assessment_purchased") {
      nnPipelineActions.push({ stage: "assessment_completed", label: "Assessment completed" });
    }
    if (tier === "assessment_completed" || tier === "assessment_purchased") {
      nnPipelineActions.push({ stage: "programme_enrolled", label: "Mark programme enrolled" });
    }
  }

  const pipelineActions: Array<{ stage: string; label: string }> = isNn ? nnPipelineActions : [];
  if (!isNn) {
    switch (data.caseStage) {
      case "DOCUMENTS_RECEIVED":
      case "APPLICATION_PREPARING":
        pipelineActions.push({
          stage: "APPLICATION_SUBMITTED",
          label: "Mark application submitted",
        });
        break;
      case "APPLICATION_SUBMITTED":
        pipelineActions.push({ stage: "OFFER_RECEIVED", label: "Mark offer received" });
        break;
      case "OFFER_RECEIVED":
        pipelineActions.push({
          stage: "COMPLETION_SCHEDULED",
          label: "Schedule completion",
        });
        break;
      case "COMPLETION_SCHEDULED":
        break;
      default:
        break;
    }
  }

  const isCompleted = isNn
    ? data.funnelStage === "programme_enrolled" ||
      data.status === "WON" ||
      data.caseStage === "COMPLETED"
    : (data.initialInvoiceAmount ?? 0) > 0 ||
      data.caseStage === "COMPLETED" ||
      data.status === "WON";
  const isClosed =
    data.caseStage === "LOST" ||
    data.caseStage === "DISQUALIFIED" ||
    data.status === "LOST" ||
    data.status === "DISQUALIFIED";

  return (
    <>
    <div className="pb-32 md:pb-8">
    <div className="p-4 md:p-8">
      <Link
        href="/workspace"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Back to command centre
      </Link>

      {isCompleted && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>{isNn ? "Programme enrolled" : "Sale completed"}</strong> — this case is closed. View it anytime under{" "}
          <Link href="/workspace/completions" className="font-semibold underline hover:no-underline">
            {isNn ? "Enrolled" : "Sale Completed"}
          </Link>
          .
        </div>
      )}

      {isClosed && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <strong>Case closed</strong> — view all archived cases under{" "}
          <Link href="/workspace/closed" className="font-semibold underline hover:no-underline">
            Lost / Disqualified
          </Link>
          .
          {data.winbackStatus === "active" && (
            <p className="mt-2 text-slate-700">
              <strong>Win-back active</strong> — step {data.winbackStep}/{closedWinbackSteps}
              {data.winbackNextAt
                ? ` · next email ${formatDate(data.winbackNextAt)}`
                : ""}
              .{" "}
              <Link
                href="/workspace/re-engagement"
                className="font-semibold underline hover:no-underline"
              >
                Re-engagement queue
              </Link>
            </p>
          )}
          {data.winbackStatus === "paused" && (
            <p className="mt-2 text-amber-800">
              <strong>Win-back paused</strong> — step {data.winbackStep}/{closedWinbackSteps}.
            </p>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-navy">
              {data.firstName} {data.lastName}
            </h1>
            <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy">
              {isNn ? nnStageLabel(data as never) : stageLabel(data.caseStage)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                data.riskLevel === "HIGH"
                  ? "bg-red-100 text-red-800"
                  : data.riskLevel === "LOW"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900",
              )}
            >
              {riskLabel(data.riskLevel)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                slaBadgeClasses(slaStatus),
              )}
            >
              {slaStatusLabel(slaStatus)}
            </span>
          </div>
          {isNn ? (
            <CaseDetailNnHeaderMeta lead={data} />
          ) : (
            <p className="mt-2 text-lg text-slate-700">
              {formatCurrency(data.loanAmount)} · {label(LOAN_PURPOSES, data.loanPurpose)} ·{" "}
              {label(TIMEFRAMES, data.timeframe)}
            </p>
          )}
        </div>
      </div>

      {isNn ? <ClinicalDashboardGrid lead={data} /> : null}

      {isNn ? (
        <WorkspaceCredentialStatusBlock
          lead={{
            id: data.id,
            email: data.email,
            credentialsProvisioned: data.credentialsProvisioned,
            funnelStage: data.funnelStage,
            updatedAt: data.updatedAt,
          }}
          resetting={saving}
          onResetCredentials={() => patch({ resetCredentials: true })}
        />
      ) : null}

      {isNn ? <CasePrintAction lead={data} /> : null}

      {isNn &&
      !data.consultationCompletedAt &&
      (data.funnelStage === "discovery_requested" ||
        data.caseStage === "CONSULTATION_BOOKED" ||
        data.discoveryBookedAt) ? (
        <WorkspaceDiscoveryScriptPanel />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isNn ? (
            <CaseDetailNnJourney lead={data} />
          ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy">Borrower journey</h2>
            <div className="flex flex-wrap gap-1">
              {[
                "NEW_ENQUIRY",
                "CONTACTED",
                "CONSULTATION_BOOKED",
                "CONSULTATION_COMPLETED",
                "DOCUMENTS_REQUESTED",
                "DOCUMENTS_RECEIVED",
                "APPLICATION_SUBMITTED",
                "OFFER_RECEIVED",
                "COMPLETION_SCHEDULED",
                "COMPLETED",
              ].map((s) => (
                <span
                  key={s}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    data.caseStage === s
                      ? "bg-gold text-navy"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {stageLabel(s)}
                </span>
              ))}
            </div>
          </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy">Activity timeline</h2>
            <LeadActivityTimeline activities={data.activities} />
          </section>

          {!isNn ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy">Document checklist</h2>
            {data.caseDocuments && data.caseDocuments.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {data.caseDocuments.map((doc) => {
                  const viewHref = documentViewHref(caseId, doc);
                  const uploaded = doc.status === "UPLOADED" || doc.status === "ACCEPTED";
                  return (
                    <li
                      key={doc.id}
                      className="flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-navy">
                          {doc.label}
                          {!doc.required && (
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              (optional)
                            </span>
                          )}
                        </p>
                        {uploaded && doc.fileName && (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{doc.fileName}</p>
                        )}
                        {uploaded && doc.uploadedAt && (
                          <p className="text-xs text-slate-400">
                            Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            uploaded ? "text-emerald-700" : "text-slate-500",
                          )}
                        >
                          {doc.status === "UPLOADED"
                            ? "Uploaded"
                            : doc.status === "ACCEPTED"
                              ? "Accepted"
                              : doc.status === "NEEDS_REPLACEMENT"
                                ? "Needs replacement"
                                : "Required"}
                        </span>
                        {viewHref && (
                          <a
                            href={viewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                        {viewHref && (
                          <a
                            href={viewHref}
                            download={doc.fileName ?? undefined}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-100"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No documents requested yet.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowDocModal(true)}
              disabled={saving}
            >
              <FileText className="mr-1 h-4 w-4" />
              Request documents
            </Button>
          </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Internal notes</h2>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note…"
              className="mb-3"
            />
            <Button size="sm" onClick={addNote} disabled={!note.trim()}>
              Add note
            </Button>
            <div className="mt-4 space-y-3">
              {data.notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-navy">{n.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.author} · {formatDate(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next action
            </h2>
            <p className="mt-2 font-semibold text-navy">{data.nextAction ?? (isNn ? "Call client" : "Call borrower")}</p>
            {data.nextActionAt && (
              <p className="mt-1 text-sm text-slate-600">Due {formatDate(data.nextActionAt)}</p>
            )}
            <p className="mt-3 text-sm">Owner: {data.owner ?? (isNn ? "Emer" : "Daniel")}</p>
            {data.priorityCallSlot && (
              <p className="mt-1 text-sm text-violet-700">Call: {data.priorityCallSlot}</p>
            )}
            {data.teamsMeetingUrl && (
              <a
                href={data.teamsMeetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-blue-700 hover:underline"
              >
                Teams meeting link
              </a>
            )}
            <div className="mt-4 hidden md:block">
              <LeadContactActions
                leadId={caseId}
                firstName={data.firstName}
                phone={data.phone}
                email={data.email}
                onLogged={load}
              />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {actionError && (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {actionError}
                </p>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFollowUpMode("contact");
                  setShowFollowUpPicker(true);
                }}
                disabled={saving}
              >
                Mark as contacted
              </Button>
              {data.operationalQueue === "AWAITING_CALLBACK" && !isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFollowUpMode("reschedule");
                    setShowFollowUpPicker(true);
                  }}
                  disabled={saving}
                >
                  Reschedule follow-up
                </Button>
              )}
              {data.bookingChaseEnrolled && (
                <p className="text-xs text-violet-700">
                  Auto nudge active — day {data.bookingChaseStep}/7
                </p>
              )}
              {isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFollowUpMode("reopen");
                    setShowFollowUpPicker(true);
                  }}
                  disabled={saving}
                >
                  Reopen to follow-up
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => patch({ consultationCompleted: true })} disabled={saving}>
                Consultation completed
              </Button>
              {isNn &&
                (data.segment === "clinician" || data.segment === "employer") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      patch({
                        linkedinOutreach: {
                          campaignKey:
                            data.segment === "employer"
                              ? "executive-burnout-stamina"
                              : "executive-burnout-focus",
                        },
                      })
                    }
                    disabled={saving}
                  >
                    Log LinkedIn outreach
                  </Button>
                )}
              {isNn &&
                (data.funnelStage === "discovery_requested" ||
                  data.funnelStage === "b2b_briefing_booked" ||
                  data.funnelStage === "clinician_briefing_downloaded" ||
                  data.caseStage === "CONSULTATION_BOOKED" ||
                  data.discoveryBookedAt) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => patch({ briefingNoShow: true })}
                    disabled={saving}
                  >
                    Briefing no-show
                  </Button>
                )}
              {isNn &&
                !data.consultationCompletedAt &&
                data.segment !== "clinician" &&
                (data.funnelStage === "discovery_requested" ||
                  data.caseStage === "CONSULTATION_BOOKED" ||
                  data.discoveryBookedAt) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patch({ consultationNoShow: true })}
                    disabled={saving}
                  >
                    Discovery no-show
                  </Button>
                )}
              {pipelineActions.map((action) => (
                <Button
                  key={action.stage}
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    patch(
                      isNn
                        ? { advanceFunnelStage: action.stage }
                        : { advanceStage: action.stage },
                    )
                  }
                  disabled={saving}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {isNn ? (
            <CaseDetailNnSummary lead={data} />
          ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Case summary</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Loan" value={formatCurrency(data.loanAmount)} />
              <Row label="Property" value={label(PROPERTY_TYPES, data.propertyType)} />
              <Row label="Location" value={data.propertyLocation} />
              <Row label="Value" value={formatCurrency(data.propertyValue)} />
              <Row label="Purpose" value={label(LOAN_PURPOSES, data.loanPurpose)} />
              <Row label="Timeline" value={label(TIMEFRAMES, data.timeframe)} />
              {data.formCompleted && (
                <>
                  <Row label="Will occupy" value={data.willOccupy ? "Yes" : "No"} />
                  <Row label="Ever occupied" value={data.hasEverOccupied ? "Yes" : "No"} />
                </>
              )}
              <Row label="Email" value={data.email} />
              <Row label="Phone" value={formatUKPhoneDisplay(data.phone)} />
            </dl>
            <AttributionPanel lead={data} className="mt-4 border-t border-slate-100 pt-4" />
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400">Deal economics</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Initial invoice moves the lead to Completed. Commission can be added anytime after.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-500">
                  Initial invoice paid (£)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={data.initialInvoiceAmount ?? ""}
                    placeholder="0"
                    disabled={isCompleted && (data.initialInvoiceAmount ?? 0) > 0}
                    onChange={(e) =>
                      setData((d) =>
                        d
                          ? {
                              ...d,
                              initialInvoiceAmount: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : d,
                      )
                    }
                    onBlur={(e) => {
                      void patch({
                        initialInvoiceAmount: parseMoneyInput(e.currentTarget.value),
                      });
                    }}
                  />
                </label>
                <label className="text-xs text-slate-500">
                  Commission earned (£)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={data.revenueGenerated ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      setData((d) =>
                        d
                          ? {
                              ...d,
                              revenueGenerated: e.target.value ? Number(e.target.value) : null,
                            }
                          : d,
                      )
                    }
                    onBlur={(e) => {
                      void patch({
                        revenueGenerated: parseMoneyInput(e.currentTarget.value),
                      });
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-sm font-medium text-navy">
                {formatCurrency(data.estimatedCommission ?? 0)} est. commission
              </p>
              <p className="text-xs text-slate-500">
                {data.probability}% probability ·{" "}
                {formatCurrency(data.expectedValue ?? 0)} expected value
              </p>
            </div>
          </div>
          )}

          {!isCompleted && !isClosed && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-navy">Close case</h2>
            <div className="space-y-3">
              <Select
                value={lostReason}
                onChange={(e) => {
                  const reason = e.target.value as typeof lostReason;
                  setLostReason(reason);
                  setStartWinback(suggestWinbackForLostReason(reason));
                }}
              >
                {(isNn ? nnLostReasonOptions() : LOST_REASONS).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={startWinback}
                  disabled={!canEnrollWinback(lostReason)}
                  onChange={(e) => setStartWinback(e.target.checked)}
                />
                <span>
                  Start win-back sequence
                  {!canEnrollWinback(lostReason) && (
                    <span className="block text-xs text-slate-500">
                      Not offered for this lost reason
                    </span>
                  )}
                </span>
              </label>
              {startWinback && winbackPreview && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-navy">Sequence preview</p>
                  <p className="mt-1">{winbackScheduleSummary(lostReason)}</p>
                  <ul className="mt-2 list-inside list-disc space-y-0.5">
                    {winbackPreview.steps.map((step) => (
                      <li key={`${step.day}-${step.channel}-${step.label}`}>{step.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() =>
                  patch({
                    markLost: true,
                    lostReason,
                    startWinback: startWinback && canEnrollWinback(lostReason),
                  })
                }
                disabled={saving}
              >
                {startWinback && canEnrollWinback(lostReason)
                  ? "Close & start win-back"
                  : "Mark as lost"}
              </Button>
              <Select value={disqReason} onChange={(e) => setDisqReason(e.target.value as typeof disqReason)}>
                {(isNn ? nnDisqualifiedReasonOptions() : DISQUALIFIED_REASONS).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => patch({ markDisqualified: true, disqualifiedReason: disqReason })}
                disabled={saving}
              >
                Mark disqualified
              </Button>
            </div>
          </div>
          )}

          {isClosed && data.status === "LOST" && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Win-back</h2>
              <div className="space-y-2">
                {data.winbackStatus === "active" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => patch({ pauseWinback: true })}
                      disabled={saving}
                    >
                      Pause win-back
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => patch({ stopWinback: true })}
                      disabled={saving}
                    >
                      Remove from sequence
                    </Button>
                  </>
                )}
                {data.winbackStatus === "paused" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => patch({ resumeWinback: true })}
                      disabled={saving}
                    >
                      Resume win-back
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => patch({ stopWinback: true })}
                      disabled={saving}
                    >
                      Remove from sequence
                    </Button>
                  </>
                )}
                {!data.winbackEnrolled &&
                  data.winbackStatus !== "active" &&
                  data.winbackStatus !== "paused" &&
                  canEnrollWinback(data.lostReason) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => patch({ enrollWinback: true })}
                      disabled={saving}
                    >
                      Start win-back sequence
                    </Button>
                  )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => patch({ reopenCase: true })}
                  disabled={saving}
                >
                  Re-open enquiry
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-red-800">Delete case</h2>
            <p className="mb-3 text-xs text-slate-600">
              Permanently remove this lead, timeline, tasks, and documents. Use this to clear test
              data — this cannot be undone.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => {
                setDeleteConfirm("");
                setShowDeleteModal(true);
              }}
              disabled={saving || deleting}
            >
              Delete case permanently
            </Button>
          </div>
        </aside>
      </div>

      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-navy">Request documents</h3>
            <p className="mt-1 text-sm text-slate-600">
              Select required documents. Borrower will receive email and SMS with upload link.
            </p>
            <ul className="mt-4 space-y-2">
              {BRIDGING_DOCUMENT_TEMPLATE.map((doc) => (
                <li key={doc.docKey}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.docKey)}
                      onChange={(e) => {
                        setSelectedDocs((prev) =>
                          e.target.checked
                            ? [...prev, doc.docKey]
                            : prev.filter((k) => k !== doc.docKey),
                        );
                      }}
                    />
                    {doc.label}
                  </label>
                </li>
              ))}
            </ul>
            {docRequestError && (
              <p className="mt-3 text-sm font-medium text-red-600" role="alert">
                {docRequestError}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <Button onClick={requestDocs} disabled={saving || selectedDocs.length === 0}>
                Send request
              </Button>
              <Button variant="outline" onClick={() => setShowDocModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-red-800">Delete case permanently?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes <strong>{data.firstName} {data.lastName}</strong> ({data.email}) and all
              related CRM data. Uploaded files on this server will be removed. Scheduled emails and
              SMS for this case will stop because the record is gone.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="DELETE"
              autoComplete="off"
            />
            {actionError && (
              <p className="mt-3 text-sm font-medium text-red-600" role="alert">
                {actionError}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <Button
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={() => void deleteCase()}
                disabled={deleting || deleteConfirm !== "DELETE"}
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setActionError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>

    <FollowUpPicker
      open={showFollowUpPicker}
      onClose={() => setShowFollowUpPicker(false)}
      saving={saving}
      title={
        followUpMode === "reschedule"
          ? "Reschedule follow-up"
          : followUpMode === "reopen"
            ? "Reopen to follow-up"
            : "When should you follow up?"
      }
      description={
        followUpMode === "reopen"
          ? "Clears completed status and returns the lead to Follow-Up."
          : "The lead stays in Follow-Up until initial invoice is paid."
      }
      onConfirm={(payload) => {
        setShowFollowUpPicker(false);
        if (followUpMode === "contact") {
          void patch({ markContacted: true, ...payload });
        } else if (followUpMode === "reschedule") {
          void patch({ rescheduleFollowUp: true, ...payload });
        } else {
          void patch({ reopenToFollowUp: true, ...payload });
        }
      }}
    />

    <CaseDetailMobileBar data={data as unknown as Lead} onRefresh={() => void load()} hidden={isCompleted || isClosed} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
