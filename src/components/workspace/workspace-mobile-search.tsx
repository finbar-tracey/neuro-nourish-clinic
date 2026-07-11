"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { CaseView } from "@/lib/case";
import { deserializeCaseView } from "@/lib/workspace-case";
import { cn } from "@/lib/utils";

function matchesQuery(c: CaseView, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  return (
    c.borrowerName.toLowerCase().includes(needle) ||
    c.phone.includes(needle) ||
    c.email.toLowerCase().includes(needle)
  );
}

export function WorkspaceMobileSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadCases = useCallback(async () => {
    if (cases.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/operational");
      if (!res.ok) {
        setError("Could not load cases");
        return;
      }
      const json = (await res.json()) as { cases: Record<string, unknown>[] };
      setCases(
        json.cases.map((c) => deserializeCaseView({ ...c, lead: c.lead ?? c })),
      );
    } catch {
      setError("Could not load cases");
    } finally {
      setLoading(false);
    }
  }, [cases.length]);

  useEffect(() => {
    if (open) {
      void loadCases();
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, loadCases]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return cases.filter((c) => matchesQuery(c, query)).slice(0, 8);
  }, [cases, query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
        aria-label="Search cases"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases…"
            aria-label="Search cases by name, phone, or email"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-white/20 bg-white/10 pl-9 pr-3 text-base text-white placeholder:text-slate-400 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>
        <button
          type="button"
          onClick={close}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {(loading || error || results.length > 0 || query.trim().length >= 2) && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {loading && <p className="px-3 py-2 text-sm text-slate-500">Loading cases…</p>}
          {error && <p className="px-3 py-2 text-sm text-red-600">{error}</p>}
          {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">No matching cases</p>
          )}
          {results.map((c) => (
            <Link
              key={c.caseId}
              href={`/workspace/cases/${c.caseId}`}
              onClick={close}
              className={cn(
                "block border-b border-slate-100 px-3 py-2.5 text-sm last:border-0 hover:bg-slate-50",
              )}
            >
              <p className="font-semibold text-navy">{c.borrowerName}</p>
              <p className="text-xs text-slate-500">{c.phone}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
