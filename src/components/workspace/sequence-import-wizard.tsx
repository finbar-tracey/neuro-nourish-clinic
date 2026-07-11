"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";
import { winbackScheduleSummary } from "@/lib/winback-schedule";
import { LAWFUL_BASES, type ImportOutcomeCode, type LawfulBasis } from "@/lib/sequence-csv-import/types";

type PreviewSummary = {
  enrollable: number;
  skipped: number;
  estimatedEmails: number;
  estimatedSms: number;
  [key: string]: number;
};

type PreviewRow = {
  line: number;
  email: string;
  name: string;
  outcome: ImportOutcomeCode;
  detail: string | null;
};

type Props = {
  open: boolean;
  initialSequenceId?: string;
  onClose: () => void;
  onComplete: () => void;
};

const SEQUENCE_OPTIONS = [
  {
    id: WINBACK_SEQUENCE_ID,
    name: "Win-back — standard",
    description: winbackScheduleSummary("No response"),
    lostReason: "No response",
  },
  {
    id: WINBACK_LONG_SEQUENCE_ID,
    name: "Win-back — long",
    description: winbackScheduleSummary("Funding no longer needed"),
    lostReason: "Funding no longer needed",
  },
] as const;

const OUTCOME_LABELS: Record<ImportOutcomeCode, string> = {
  CREATE_ENROLL: "Create & enroll",
  MERGE_ENROLL: "Merge & enroll",
  REENROLL: "Re-enroll",
  SKIP_ENROLLED: "Skip — enrolled",
  SKIP_ACTIVE: "Skip — active case",
  SKIP_WON: "Skip — won",
  SKIP_DISQUALIFIED: "Skip — disqualified",
  SKIP_OPTED_OUT: "Skip — opted out",
  SKIP_INVALID_EMAIL: "Skip — invalid",
  SKIP_INVALID_FILE_DUP: "Skip — duplicate in file",
};

const LAWFUL_LABELS: Record<LawfulBasis, string> = {
  consent: "Consent",
  legitimate_interest: "Legitimate interest (prior enquiry)",
  existing_customer: "Existing customer relationship",
};

export function SequenceImportWizard({
  open,
  initialSequenceId = WINBACK_SEQUENCE_ID,
  onClose,
  onComplete,
}: Props) {
  const [step, setStep] = useState(1);
  const [sequenceId, setSequenceId] = useState(initialSequenceId);
  const [campaign, setCampaign] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [lawfulBasis, setLawfulBasis] = useState<LawfulBasis>("existing_customer");
  const [attestation, setAttestation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ enrolled: number; skipped: number } | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setSequenceId(initialSequenceId);
    setCampaign("");
    setFile(null);
    setPreviewId(null);
    setSummary(null);
    setRows([]);
    setLawfulBasis("existing_customer");
    setAttestation(false);
    setLoading(false);
    setError(null);
    setResult(null);
  }, [initialSequenceId]);

  const close = () => {
    reset();
    onClose();
  };

  const selectedSequence = useMemo(
    () => SEQUENCE_OPTIONS.find((s) => s.id === sequenceId) ?? SEQUENCE_OPTIONS[0],
    [sequenceId],
  );

  async function runPreview() {
    if (!file) {
      setError("Choose a CSV file");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("sequenceId", sequenceId);
      form.set("campaign", campaign);
      const res = await fetch("/api/workspace/sequences/import/preview", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        previewId?: string;
        summary?: PreviewSummary;
        rows?: PreviewRow[];
      };
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreviewId(data.previewId ?? null);
      setSummary(data.summary ?? null);
      setRows(data.rows ?? []);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!previewId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/sequences/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewId,
          lawfulBasis,
          attestationAccepted: attestation,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        batch?: { enrolled: number; skipped: number };
      };
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({
        enrolled: data.batch?.enrolled ?? 0,
        skipped: data.batch?.skipped ?? 0,
      });
      setStep(5);
      window.dispatchEvent(new Event("workspace:counts-changed"));
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    window.location.href = `/api/workspace/sequences/import/template?sequenceId=${sequenceId}`;
  }

  function downloadSkipReport() {
    if (!rows.length) return;
    const header = "line,email,name,outcome,detail\n";
    const body = rows
      .map((r) =>
        [r.line, r.email, r.name, r.outcome, r.detail ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-preview-${campaign || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy">Import CSV into sequence</h2>
          <p className="mt-1 text-sm text-slate-600">
            Step {step} of 5 — enroll cold leads into win-back automation
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Choose which sequence to enroll leads into.</p>
              {SEQUENCE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    sequenceId === option.id
                      ? "border-gold bg-gold/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="sequence"
                    checked={sequenceId === option.id}
                    onChange={() => setSequenceId(option.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-navy">{option.name}</span>
                    <span className="mt-1 block text-sm text-slate-600">{option.description}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Lost reason: {option.lostReason}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Campaign name</label>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="cold_meta_jun26"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used to filter and measure this import cohort later.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                  Download template
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-sm font-medium text-navy">
                  {file ? file.name : "Drop CSV here or click to browse"}
                </span>
                <span className="mt-1 text-xs text-slate-500">Max 500 rows · 1 MB</span>
              </label>
            </div>
          )}

          {step === 4 && summary && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {summary.enrollable} to enroll
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {summary.skipped} skipped
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  ~{summary.estimatedEmails} emails
                </span>
                {summary.estimatedSms > 0 && (
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                    ~{summary.estimatedSms} SMS
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Line</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row) => (
                      <tr key={`${row.line}-${row.email}`} className="border-t border-slate-100">
                        <td className="px-3 py-2">{row.line}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">
                          {OUTCOME_LABELS[row.outcome]}
                          {row.detail ? ` — ${row.detail}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={downloadSkipReport}>
                Download full preview report
              </Button>

              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Lawful basis</label>
                <select
                  value={lawfulBasis}
                  onChange={(e) => setLawfulBasis(e.target.value as LawfulBasis)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {LAWFUL_BASES.map((basis) => (
                    <option key={basis} value={basis}>
                      {LAWFUL_LABELS[basis]}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={attestation}
                  onChange={(e) => setAttestation(e.target.checked)}
                />
                <span>
                  I confirm this list excludes unsubscribed contacts, matches the lawful basis
                  selected, and I am authorised to send marketing for Bridging Loans Broker.
                </span>
              </label>
            </div>
          )}

          {step === 5 && result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-semibold text-emerald-900">Import complete</p>
              <p className="mt-2 text-sm text-emerald-800">
                {result.enrolled} enrolled · {result.skipped} skipped
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                Campaign: {campaign} · {selectedSequence.name}
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <Button type="button" variant="outline" onClick={close} disabled={loading}>
            {step === 5 ? "Close" : "Cancel"}
          </Button>
          <div className="flex gap-2">
            {step > 1 && step < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            {step === 1 && (
              <Button type="button" onClick={() => setStep(2)} disabled={loading}>
                Next
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={loading || !campaign.trim()}
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button type="button" onClick={() => void runPreview()} disabled={loading || !file}>
                {loading ? "Previewing…" : "Preview import"}
              </Button>
            )}
            {step === 4 && (
              <Button
                type="button"
                onClick={() => void runCommit()}
                disabled={loading || !attestation || !previewId || (summary?.enrollable ?? 0) === 0}
              >
                {loading ? "Importing…" : `Import ${summary?.enrollable ?? 0} leads`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
