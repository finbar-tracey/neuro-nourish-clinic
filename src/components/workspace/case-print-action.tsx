"use client";

import { Printer, Shield } from "lucide-react";
import { primaryConcernFromLead } from "@/lib/neuronourish-workspace";
import type { Lead } from "@/generated/prisma/client";

type CasePrintLead = Pick<
  Lead,
  "id" | "firstName" | "lastName" | "email" | "quizScore" | "primaryConcern" | "loanPurpose" | "revenueEur"
> & {
  creditExpiryDate?: Date | string | null;
};

export function CasePrintAction({ lead }: { lead: CasePrintLead }) {
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const concern =
    primaryConcernFromLead(lead as Lead)?.replace(/_/g, " ") ?? "General prevention";

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end border-b border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-gold/40 bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          <Printer className="h-4 w-4 text-gold" aria-hidden />
          Generate print progress dossier
        </button>
      </div>

      <div className="print-container hidden print:block">
        <div className="print-header-serif flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">NEURONOURISH CLINIC</h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
              Confidential patient progress dossier · Clinical oversight record
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500">
            ID: {lead.id.toUpperCase()}
            <br />
            Generated: {new Date().toLocaleDateString("en-IE")}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 border-b border-slate-200 pb-2 font-serif text-lg font-bold text-navy">
            Patient identity & core boundary profile
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Full client name:</strong> {name}
            </div>
            <div>
              <strong>Secure email contact:</strong> {lead.email}
            </div>
            <div>
              <strong>Primary cognitive concern:</strong>{" "}
              <span className="capitalize">{concern}</span>
            </div>
            <div>
              <strong>Active financial tier:</strong> €{lead.revenueEur.toLocaleString("en-IE")}{" "}
              captured revenue
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="mb-2 border-b border-slate-200 pb-2 font-serif text-lg font-bold text-navy">
            Multi-modal diagnostic metric tracking
          </h2>

          <div className="print-metric-card">
            <h3 className="mb-1 text-base font-bold text-navy">
              Baseline digital cognitive baseline score
            </h3>
            <p className="font-serif text-2xl font-bold text-gold">
              {lead.quizScore != null ? `${lead.quizScore} / 100` : "Data pending clinical run"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Initial lifestyle scoring array evaluating modifiable environment and systemic
              protection parameters.
            </p>
          </div>

          <div className="print-metric-card">
            <h3 className="mb-1 text-base font-bold text-navy">
              CNS Vital Signs testing validation window
            </h3>
            <p className="text-sm font-bold text-navy">
              {lead.creditExpiryDate
                ? `Authorized testing expiration: ${new Date(lead.creditExpiryDate).toLocaleDateString("en-IE")}`
                : "Cognitive testing profile status: Access profile not yet purchased."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Strict 30-day clinical token compliance window to safeguard longitudinal data
              integrity before habit architecture implementation.
            </p>
          </div>
        </div>

        <div className="page-break" />

        <div className="mt-12 border-t border-slate-200 pt-12">
          <h2 className="mb-6 font-serif text-lg font-bold text-navy">
            Care review notes & authorization boundaries
          </h2>
          <div className="mb-6 h-32 rounded border border-slate-200 bg-white p-4 text-xs text-slate-500">
            [ Clinician notes entry matrix ]
          </div>
          <div className="flex items-center justify-between pt-8 text-sm">
            <div className="w-52 border-t border-slate-300 pt-2 text-center text-xs">
              Primary reviewing nutrition scientist
            </div>
            <div className="w-52 border-t border-slate-300 pt-2 text-center text-xs">
              CORU dietetic supervisor signature
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 text-center text-[10px] text-slate-500">
            <Shield className="h-3 w-3 text-gold" aria-hidden />
            <span>
              This dossier contains protected data subject to medical confidentiality regulations.
              Securely handled via NeuroNourish CRM.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
