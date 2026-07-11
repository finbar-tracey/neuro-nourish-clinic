"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Sparkles, Trash2, X } from "lucide-react";

function allowDemoControls() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

export function DemoDataBanner() {
  const [status, setStatus] = useState<"loading" | "empty" | "has-demo" | "hidden">("loading");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [demoAllowed, setDemoAllowed] = useState(false);

  useEffect(() => {
    setDemoAllowed(allowDemoControls());
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/workspace/seed-demo");
      if (!res.ok) return;
      const data = (await res.json()) as { empty: boolean; hasDemo: boolean };
      if (data.hasDemo) setStatus("has-demo");
      else if (data.empty) {
        setStatus("empty");
        if (process.env.NODE_ENV === "development" && allowDemoControls()) {
          setBusy(true);
          try {
            await fetch("/api/workspace/seed-demo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ force: false }),
            });
            setStatus("has-demo");
            window.dispatchEvent(new Event("workspace:refresh"));
          } finally {
            setBusy(false);
          }
        }
      } else setStatus("hidden");
    })();
  }, []);

  async function seed(force = false) {
    setBusy(true);
    try {
      await fetch("/api/workspace/seed-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      setStatus("has-demo");
      window.dispatchEvent(new Event("workspace:refresh"));
    } finally {
      setBusy(false);
    }
  }

  async function clearDemoOnly() {
    setBusy(true);
    try {
      await fetch("/api/workspace/seed-demo", { method: "DELETE" });
      setStatus("hidden");
      window.dispatchEvent(new Event("workspace:refresh"));
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "hidden" || dismissed) return null;

  if (status === "has-demo") {
    if (!demoAllowed) return null;
    return (
      <div className="border-b border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-900 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
            <span>
              <strong>Demo data loaded</strong> — sample cases across all queues for UI preview.
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void seed(true)}
              className="rounded-md border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-violet-100"
            >
              Reload demo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void clearDemoOnly()}
              className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-violet-100"
            >
              <Trash2 className="h-3 w-3" />
              Clear demo
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded p-1 hover:bg-violet-200/60"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Database className="h-4 w-4 shrink-0 text-amber-700" />
          {demoAllowed
            ? "No cases yet. Load sample data to preview every workspace view."
            : "CRM is empty — new enquiries from the landing page will appear here."}
        </span>
        {demoAllowed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void seed(false)}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy/90"
          >
            {busy ? "Loading…" : "Load demo cases"}
          </button>
        )}
      </div>
    </div>
  );
}
