"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, MessageSquare, ShieldAlert } from "lucide-react";
import { NN_DISCOVERY_CALL_SCRIPT } from "@/lib/neuronourish-copy";
import { cn } from "@/lib/utils";

const TAB_IDS = ["grounding", "intake", "timeline", "close"] as const;
type ScriptTabId = (typeof TAB_IDS)[number];

const tabs: {
  id: ScriptTabId;
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { id: "grounding", label: "1. Grounding (0–3m)", icon: MessageSquare },
  { id: "intake", label: "2. Biomarker Intake (3–8m)", icon: ShieldAlert },
  { id: "timeline", label: "3. The 12m Science (8–12m)", icon: BookOpen },
  { id: "close", label: "4. Close & Offer (12–15m)", icon: ArrowRight },
];

export function WorkspaceDiscoveryScriptPanel() {
  const [activeTab, setActiveTab] = useState<ScriptTabId>("grounding");

  const phaseById = useMemo(
    () => Object.fromEntries(NN_DISCOVERY_CALL_SCRIPT.phases.map((p) => [p.id, p])),
    [],
  );

  const currentScript = phaseById[activeTab];

  if (!currentScript) return null;

  const closePhase = NN_DISCOVERY_CALL_SCRIPT.phases.find((p) => p.id === "close");
  const closeOffer =
    closePhase && "assessmentOffer" in closePhase ? closePhase.assessmentOffer : undefined;

  return (
    <div className="no-print my-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gold/30 bg-navy px-6 py-3">
        <h3 className="font-serif text-lg font-bold tracking-wide text-white">
          Live Clinical Consultation Guide (15-Min Discovery Engine)
        </h3>
        <span className="rounded border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-medium text-gold">
          Caregiver + Sage Active Script
        </span>
      </div>

      <div className="flex border-b border-slate-200 bg-slate-50 text-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-r border-slate-200 px-3 py-3 font-semibold transition-all last:border-r-0",
                activeTab === tab.id
                  ? "border-b-2 border-b-gold bg-white text-navy"
                  : "text-slate-500 hover:bg-white/80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden text-left sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 bg-white p-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-gold">
            Objective: {currentScript.goal}
          </span>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 font-sans text-sm italic leading-relaxed text-slate-700">
            &ldquo;{currentScript.script}&rdquo;
          </div>
          {activeTab === "close" && closeOffer && (
            <div className="mt-4 space-y-1 rounded border border-gold/20 bg-gold/5 p-3 text-xs text-slate-700">
              <strong>High-ticket anchoring strategy:</strong> Offer the{" "}
              {closeOffer.product} at {closeOffer.priceLabel} — pathway to the{" "}
              {closeOffer.programmeAnchor}.
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              CRM logger prompt
            </span>
            <p className="font-mono text-xs leading-relaxed text-slate-600">
              {currentScript.crmNote}
            </p>
          </div>
          <p className="mt-4 border-t border-slate-200 pt-4 text-center text-[10px] italic text-slate-400">
            Ensure notes match primary concern tracking flags.
          </p>
        </div>
      </div>
    </div>
  );
}
