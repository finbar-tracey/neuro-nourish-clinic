"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ACTION_LABELS,
  TRIGGER_LABELS,
} from "@/components/workspace/shared";
import { formatDate } from "@/lib/utils";
import { Bot, Power, PowerOff } from "lucide-react";

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  action: string;
  config: string;
  enabled: boolean;
  createdAt: string;
  _count: { runs: number };
  runs: { id: string; status: string; message: string | null; createdAt: string }[];
};

export function AutomationsPanel({ embedded = false }: { embedded?: boolean }) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  function loadRules() {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((data) => {
        setRules(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function toggleRule(id: string, enabled: boolean) {
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    loadRules();
  }

  return (
    <div className={embedded ? "" : "p-8"}>
      {!embedded && (
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Automations</h1>
        <p className="text-sm text-slate-500">
          Rules that run automatically when leads are created or updated
        </p>
      </div>
      )}
      {embedded && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-navy">Event rules</h2>
          <p className="text-sm text-slate-500">
            Rules that run automatically when leads are created or updated
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading automations...</p>
      ) : rules.length === 0 ? (
        <p className="text-slate-500">No automation rules configured.</p>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const config = JSON.parse(rule.config) as Record<string, string>;
            return (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                      <Bot className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy">{rule.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rule.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="mt-1 text-sm text-slate-500">{rule.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                          Trigger: {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
                        </span>
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-purple-700">
                          Action: {ACTION_LABELS[rule.action] ?? rule.action}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                          {rule._count.runs} runs
                        </span>
                      </div>
                      {Object.keys(config).length > 0 && (
                        <pre className="mt-3 max-w-xl overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                          {JSON.stringify(config, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                  >
                    {rule.enabled ? (
                      <>
                        <PowerOff className="mr-1 h-4 w-4" /> Disable
                      </>
                    ) : (
                      <>
                        <Power className="mr-1 h-4 w-4" /> Enable
                      </>
                    )}
                  </Button>
                </div>

                {rule.runs.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-medium text-slate-500">
                      Recent runs
                    </p>
                    <div className="space-y-1">
                      {rule.runs.map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span
                            className={
                              run.status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {run.status} — {run.message}
                          </span>
                          <span className="text-slate-400">
                            {formatDate(run.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <h3 className="font-semibold text-navy">How automations work</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            <strong>LEAD_CREATED</strong> — fires when someone submits the multi-step form
          </li>
          <li>
            <strong>STATUS_CHANGED</strong> — fires when you update a lead&apos;s pipeline
            status
          </li>
          <li>
            Actions can add notes, create follow-up tasks, queue emails, or call webhooks
          </li>
          <li>
            Use template variables: {"{{firstName}}"}, {"{{lastName}}"}, {"{{email}}"},
            {" {{loanAmount}}"}, {"{{status}}"}
          </li>
        </ul>
      </div>
    </div>
  );
}
