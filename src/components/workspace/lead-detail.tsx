"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { LEAD_STATUSES, StatusBadge } from "@/components/workspace/shared";
import { LeadActivityTimeline } from "@/components/workspace/lead-activity-timeline";
import { LeadContactActions } from "@/components/workspace/lead-contact-actions";
import { getQualificationPill } from "@/lib/lead-pipeline";
import { INBOX_QUEUES } from "@/lib/operational-queue";
import {
  formatResponseTime,
  formatWaitingLabel,
  getSlaStatus,
  slaBadgeClasses,
  slaStatusLabel,
  estimateCommission,
} from "@/lib/speed-to-lead";
import {
  LOAN_PURPOSES,
  PROPERTY_TYPES,
  TIMEFRAMES,
} from "@/lib/validations";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Mail, Phone, Trophy, XCircle } from "lucide-react";
import { AttributionPanel } from "@/components/workspace/attribution-panel";
import { hasAttributionData } from "@/lib/attribution-display";

type Lead = {
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
  ltv: string | null;
  timeframe: string;
  hasExistingMortgage: boolean;
  nurtureEnrolled?: boolean;
  formCompleted?: boolean;
  qualificationTier?: string | null;
  additionalInfo: string | null;
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
  source: string;
  status: string;
  owner?: string;
  operationalQueue?: string;
  nextAction?: string | null;
  nextActionAt?: string | null;
  callbackDueAt?: string | null;
  priorityCallSlot?: string | null;
  attributionChannel: string | null;
  firstResponseAt?: string | null;
  responseTimeMinutes?: number | null;
  conversationStarted?: boolean;
  estimatedCommission?: number | null;
  willOccupy?: boolean;
  hasEverOccupied?: boolean;
  createdAt: string;
  notes: { id: string; content: string; author: string; createdAt: string }[];
  activities: { id: string; type: string; description: string; createdAt: string }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    dueDate: string | null;
  }[];
};

export function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  function loadLead() {
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then(setLead);
  }

  useEffect(() => {
    loadLead();
  }, [leadId]);

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadLead();
    setSaving(false);
  }

  async function updateQueue(operationalQueue: string, nextAction: string) {
    setSaving(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operationalQueue, nextAction }),
    });
    loadLead();
    setSaving(false);
  }

  async function requestDocs() {
    setSaving(true);
    await fetch(`/api/leads/${leadId}/request-documents`, { method: "POST" });
    loadLead();
    setSaving(false);
  }

  async function markContacted() {
    setSaving(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markContacted: true, status: "CONTACTED" }),
    });
    loadLead();
    setSaving(false);
  }

  async function addNote() {
    if (!note.trim()) return;
    await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    setNote("");
    loadLead();
  }

  async function sendFollowUpEmail() {
    setEmailSending(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setEmailFeedback(
        data.sent
          ? "Follow-up email sent successfully."
          : "Email logged to timeline. Add RESEND_API_KEY to send live.",
      );
      loadLead();
    } catch {
      setEmailFeedback("Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    loadLead();
  }

  if (!lead) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading lead...
      </div>
    );
  }

  const label = (options: readonly { value: string; label: string }[], val: string) =>
    options.find((o) => o.value === val)?.label ?? val;

  return (
    <div className="p-8">
      <Link
        href="/workspace"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Back to command centre
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">
              {lead.firstName} {lead.lastName}
            </h1>
            <StatusBadge status={lead.status} />
            {(() => {
              const pill = getQualificationPill(
                lead.qualificationTier,
                lead.formCompleted,
              );
              return pill && lead.status === "NEW" ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pill.color}`}
                >
                  {pill.label}
                </span>
              ) : null;
            })()}
            {lead.nurtureEnrolled && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Email nurture
              </span>
            )}
            {lead.formCompleted === false && lead.status === "NEW" && (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                Incomplete form
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Submitted {formatDate(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`}>
            <Button variant="outline" size="sm">
              <Phone className="mr-1 h-4 w-4" />
              {lead.phone}
            </Button>
          </a>
          <a href={`mailto:${lead.email}`}>
            <Button variant="outline" size="sm">
              <Mail className="mr-1 h-4 w-4" />
              Email
            </Button>
          </a>
          {lead.status === "NEW" && (
            <Button variant="secondary" size="sm" onClick={markContacted} disabled={saving}>
              Mark Contacted
            </Button>
          )}
          {lead.status === "CONTACTED" && (
            <Button variant="secondary" size="sm" onClick={() => updateStatus("BOOKED")} disabled={saving}>
              Mark Booked
            </Button>
          )}
          {!["WON", "LOST", "DISQUALIFIED"].includes(lead.status) && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => updateStatus("WON")}
                disabled={saving}
              >
                <Trophy className="mr-1 h-4 w-4" />
                Won
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("LOST")}
                disabled={saving}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Lost
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Operations
            </p>
            <p className="mt-1 text-sm font-semibold text-navy">
              Owner: {lead.owner ?? "Daniel"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Next action: {lead.nextAction ?? "Contact within 15 mins"}
            </p>
            {lead.priorityCallSlot && (
              <p className="mt-1 text-sm text-violet-700">
                Priority call: {lead.priorityCallSlot}
              </p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", slaBadgeClasses(getSlaStatus(lead as never)))}>
                {slaStatusLabel(getSlaStatus(lead as never))}
              </span>
              <span className="text-slate-600">{formatWaitingLabel(lead as never)}</span>
              {lead.responseTimeMinutes != null && (
                <span className="font-medium text-emerald-700">
                  · {formatResponseTime(lead.responseTimeMinutes)} response
                </span>
              )}
            </p>
            {lead.attributionChannel && (
              <p className="mt-1 text-xs text-slate-500">Source: {lead.attributionChannel}</p>
            )}
            {(lead.operationalQueue === "APPLICATION" || lead.operationalQueue === "COMPLETION") && (
              <p className="mt-1 text-sm font-medium text-green-700">
                Est. commission: {formatCurrency(lead.estimatedCommission ?? estimateCommission(lead.loanAmount))}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-sm">
            <LeadContactActions
              leadId={lead.id}
              firstName={lead.firstName}
              phone={lead.phone}
              email={lead.email}
              onLogged={loadLead}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={requestDocs}
              className="w-full"
            >
              Request documents
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gold/15 pt-4">
          {INBOX_QUEUES.map((queue) => (
            <Button
              key={queue.id}
              variant={lead.operationalQueue === queue.id ? "primary" : "outline"}
              size="sm"
              disabled={saving}
              onClick={() => updateQueue(queue.id, queue.description)}
            >
              {queue.emoji} {queue.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy">Enquiry Details</h2>
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <Detail label="Email" value={lead.email} />
              <Detail label="Phone" value={lead.phone} />
              <Detail label="Loan Purpose" value={label(LOAN_PURPOSES, lead.loanPurpose)} />
              <Detail label="Loan Amount" value={formatCurrency(lead.loanAmount)} />
              <Detail label="Term" value={`${lead.termMonths} months`} />
              <Detail label="Property Type" value={label(PROPERTY_TYPES, lead.propertyType)} />
              <Detail label="Property Value" value={formatCurrency(lead.propertyValue)} />
              <Detail label="Location" value={lead.propertyLocation} />
              <Detail label="Timeframe" value={label(TIMEFRAMES, lead.timeframe)} />
              <Detail label="LTV" value={lead.ltv ?? "—"} />
              <Detail
                label="Existing Mortgage"
                value={lead.hasExistingMortgage ? "Yes" : "No"}
              />
              {lead.formCompleted && (
                <>
                  <Detail label="Will occupy" value={lead.willOccupy ? "Yes" : "No"} />
                  <Detail label="Ever occupied" value={lead.hasEverOccupied ? "Yes" : "No"} />
                </>
              )}
            </dl>
            {hasAttributionData(lead) && (
              <AttributionPanel lead={lead} className="mt-4 border-t border-slate-100 pt-4" />
            )}
            {lead.additionalInfo && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">Additional Info</p>
                <p className="mt-1 text-sm text-navy">{lead.additionalInfo}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy">Lead Timeline</h2>
            <LeadActivityTimeline activities={lead.activities} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Update Status</h2>
            <Select
              value={lead.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={saving}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Send Email</h2>
            <p className="mb-3 text-xs text-slate-500">
              Sends a follow-up template to {lead.email}. Requires{" "}
              <code className="text-[10px]">RESEND_API_KEY</code> for live delivery.
            </p>
            <Button size="sm" onClick={sendFollowUpEmail} disabled={emailSending}>
              <Mail className="mr-1 h-4 w-4" />
              {emailSending ? "Sending..." : "Send follow-up email"}
            </Button>
            {emailFeedback && (
              <p className="mt-2 text-xs text-slate-600">{emailFeedback}</p>
            )}
          </div>

          {lead.tasks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-semibold text-navy">Tasks</h2>
              <ul className="space-y-2">
                {lead.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id, !task.completed)}
                      className="mt-0.5 shrink-0"
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${task.completed ? "text-green-600" : "text-slate-300 hover:text-green-500"}`}
                      />
                    </button>
                    <div className={task.completed ? "opacity-60" : ""}>
                      <p className={`font-medium text-navy ${task.completed ? "line-through" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Notes</h2>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="mb-3"
            />
            <Button size="sm" onClick={addNote} disabled={!note.trim()}>
              Add Note
            </Button>
            <div className="mt-4 space-y-3">
              {lead.notes.map((n) => (
                <div key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-navy">{n.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.author} · {formatDate(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
