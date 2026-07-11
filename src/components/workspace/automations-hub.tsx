"use client";

import { useState } from "react";
import { AutomationsPanel } from "@/components/workspace/automations-panel";
import { SequenceFlowsPanel } from "@/components/workspace/sequence-flows-panel";
import { cn } from "@/lib/utils";

type Tab = "flows" | "rules";

export function AutomationsHub() {
  const [tab, setTab] = useState<Tab>("flows");

  return (
    <div className="p-8">
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("flows")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "flows"
              ? "bg-white text-navy shadow-sm"
              : "text-slate-600 hover:text-navy",
          )}
        >
          Sequence flows
        </button>
        <button
          type="button"
          onClick={() => setTab("rules")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "rules"
              ? "bg-white text-navy shadow-sm"
              : "text-slate-600 hover:text-navy",
          )}
        >
          Event rules
        </button>
      </div>

      {tab === "flows" ? <SequenceFlowsPanel /> : <AutomationsPanel embedded />}
    </div>
  );
}
