import type { CrmStorePayload } from "@/lib/crm-persistence";
import { runCrmMutation } from "@/lib/db";

export type CrmBackupMeta = {
  lastCrmBackupAt: string | null;
  lastCrmBackupWeekKey: string | null;
  lastCrmBackupChecksum: string | null;
  lastCrmBackupFailureAt: string | null;
  lastCrmBackupFailureWeekKey: string | null;
  lastManualBackupAt: string | null;
};

export type PreImportBackupSnapshot = {
  batchId: string;
  createdAt: string;
  checksumSha256: string;
  store: CrmStorePayload;
};

export type CrmStoreWithBackup = CrmStorePayload & {
  crmBackupMeta?: CrmBackupMeta;
  preImportBackups?: Record<string, PreImportBackupSnapshot>;
};

export function defaultCrmBackupMeta(): CrmBackupMeta {
  return {
    lastCrmBackupAt: null,
    lastCrmBackupWeekKey: null,
    lastCrmBackupChecksum: null,
    lastCrmBackupFailureAt: null,
    lastCrmBackupFailureWeekKey: null,
    lastManualBackupAt: null,
  };
}

export function getCrmBackupMeta(store: CrmStoreWithBackup): CrmBackupMeta {
  return store.crmBackupMeta ?? defaultCrmBackupMeta();
}

export async function updateCrmBackupMeta(patch: Partial<CrmBackupMeta>) {
  await runCrmMutation((store) => {
    const s = store as CrmStoreWithBackup;
    s.crmBackupMeta = { ...getCrmBackupMeta(s), ...patch };
  });
}

export async function savePreImportSnapshot(snapshot: PreImportBackupSnapshot) {
  await runCrmMutation((store) => {
    const s = store as CrmStoreWithBackup;
    const existing = s.preImportBackups ?? {};
    const next = { ...existing, [snapshot.batchId]: snapshot };
    const keys = Object.keys(next).sort(
      (a, b) => next[b]!.createdAt.localeCompare(next[a]!.createdAt),
    );
    s.preImportBackups = {};
    for (const key of keys.slice(0, 2)) {
      s.preImportBackups[key] = next[key]!;
    }
  });
}

export function backupWeekKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  const week = Math.ceil(d / 7);
  return `crm-backup-${y}-W${m}-${week}`;
}

export function backupLondonParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? 0),
  };
}

export function isCrmBackupStale(meta: CrmBackupMeta, now = Date.now()) {
  if (!meta.lastCrmBackupAt) return true;
  const ageMs = now - new Date(meta.lastCrmBackupAt).getTime();
  return ageMs > 8 * 24 * 60 * 60 * 1000;
}
