"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseView } from "@/lib/case";
import { deserializeCaseView } from "@/lib/workspace-case";
import type {
  OperationalApiPayload,
  OperationalPriorities as PriorityIds,
  OperationalPulse,
} from "@/lib/workspace-operational-response";

export type OperationalPriorities = {
  contactToday: CaseView[];
  followUpDue: CaseView[];
  followUpOverdue: CaseView[];
  uncontactedNew: CaseView[];
  newEnquiries: CaseView[];
  priorityCallsToday: CaseView[];
  callbacksDue: CaseView[];
  documentsOutstanding: CaseView[];
  applications: CaseView[];
  atRisk: CaseView[];
  completions: CaseView[];
};

export type OperationalData = {
  pulse: OperationalPulse;
  priorities: OperationalPriorities;
  cases: CaseView[];
};

export type { OperationalPulse };

const STALE_MS = 30_000;

type CacheEntry = {
  data: OperationalData;
  loadedAt: number;
};

let sharedCache: CacheEntry | null = null;
let inflight: Promise<OperationalData | null> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function resolvePriorityList(raw: unknown, byId: Map<string, CaseView>): CaseView[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return raw
      .map((id) => byId.get(String(id)))
      .filter((c): c is CaseView => c != null);
  }
  return raw.map((item) => deserializeCaseView(item as Record<string, unknown>));
}

function resolvePriorityLists(
  ids: Partial<PriorityIds> | undefined,
  byId: Map<string, CaseView>,
): OperationalPriorities {
  const empty = {
    contactToday: [] as CaseView[],
    followUpDue: [] as CaseView[],
    followUpOverdue: [] as CaseView[],
    uncontactedNew: [] as CaseView[],
    newEnquiries: [] as CaseView[],
    priorityCallsToday: [] as CaseView[],
    callbacksDue: [] as CaseView[],
    documentsOutstanding: [] as CaseView[],
    applications: [] as CaseView[],
    atRisk: [] as CaseView[],
    completions: [] as CaseView[],
  };
  if (!ids) return empty;

  return {
    contactToday: resolvePriorityList(ids.contactToday, byId),
    followUpDue: resolvePriorityList(ids.followUpDue, byId),
    followUpOverdue: resolvePriorityList(ids.followUpOverdue, byId),
    uncontactedNew: resolvePriorityList(ids.uncontactedNew, byId),
    newEnquiries: resolvePriorityList(ids.newEnquiries, byId),
    priorityCallsToday: resolvePriorityList(ids.priorityCallsToday, byId),
    callbacksDue: resolvePriorityList(ids.callbacksDue, byId),
    documentsOutstanding: resolvePriorityList(ids.documentsOutstanding, byId),
    applications: resolvePriorityList(ids.applications, byId),
    atRisk: resolvePriorityList(ids.atRisk, byId),
    completions: resolvePriorityList(ids.completions, byId),
  };
}

function parseOperationalResponse(json: OperationalApiPayload): OperationalData {
  const cases = (json.cases ?? []).map((c) =>
    deserializeCaseView(c as unknown as Record<string, unknown>),
  );
  const byId = new Map(cases.map((c) => [c.caseId, c]));

  return {
    pulse: json.pulse,
    priorities: resolvePriorityLists(json.priorities, byId),
    cases,
  };
}

async function fetchOperationalData(force = false): Promise<OperationalData | null> {
  if (
    !force &&
    sharedCache &&
    Date.now() - sharedCache.loadedAt < STALE_MS
  ) {
    return sharedCache.data;
  }

  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/workspace/operational");
      if (res.status === 401) {
        window.location.href = "/workspace/login";
        return null;
      }
      if (!res.ok) return null;

      const json = (await res.json()) as OperationalApiPayload;
      const data = parseOperationalResponse(json);
      sharedCache = { data, loadedAt: Date.now() };
      notifyListeners();
      window.dispatchEvent(new Event("workspace:counts-changed"));
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function invalidateOperationalDataCache() {
  sharedCache = null;
  inflight = null;
}

export function useOperationalData() {
  const [data, setData] = useState<OperationalData | null>(() => sharedCache?.data ?? null);
  const [loading, setLoading] = useState(() => !sharedCache);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAt = useRef<number | null>(sharedCache?.loadedAt ?? null);

  const applyData = useCallback((next: OperationalData | null, failed: boolean) => {
    if (next) {
      setData(next);
      setError(null);
      lastLoadedAt.current = Date.now();
    } else if (failed) {
      setError("Could not load workspace data. Try refreshing.");
      if (!sharedCache) setData(null);
    }
  }, []);

  const reload = useCallback(async (background = false) => {
    if (!background && !sharedCache) setLoading(true);
    setError(null);

    const next = await fetchOperationalData(true);
    applyData(next, next == null);
    setLoading(false);
  }, [applyData]);

  useEffect(() => {
    const onStoreChange = () => {
      setData(sharedCache?.data ?? null);
      lastLoadedAt.current = sharedCache?.loadedAt ?? null;
      setLoading(false);
    };
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (sharedCache) {
        setData(sharedCache.data);
        lastLoadedAt.current = sharedCache.loadedAt;
        setLoading(false);
      }

      const next = await fetchOperationalData(false);
      if (cancelled) return;
      applyData(next, next == null && !sharedCache);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyData]);

  useEffect(() => {
    const onRefresh = () => {
      invalidateOperationalDataCache();
      void reload(true);
    };
    window.addEventListener("workspace:refresh", onRefresh);
    return () => window.removeEventListener("workspace:refresh", onRefresh);
  }, [reload]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!lastLoadedAt.current) return;
      if (Date.now() - lastLoadedAt.current > STALE_MS) {
        void reload(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload: () => reload(false),
    lastLoadedAt: lastLoadedAt.current,
    isStale: lastLoadedAt.current != null && Date.now() - lastLoadedAt.current > STALE_MS,
  };
}
