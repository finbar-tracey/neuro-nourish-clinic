import crypto from "node:crypto";

import type { CrmStorePayload } from "@/lib/crm-persistence";
import { readCrmStore } from "@/lib/crm-persistence";
import { runCrmMutation } from "@/lib/db";
import {
  IMPORT_LOCK_MS,
  PREVIEW_TTL_MS,
  type ImportBatch,
  type ImportPreview,
} from "@/lib/sequence-csv-import/types";

export type ImportStoreExtension = {
  importBatches?: ImportBatch[];
  importPreviews?: Record<string, ImportPreview>;
  importLock?: { previewId: string; until: string } | null;
};

type ImportStore = CrmStorePayload & ImportStoreExtension;

function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function cleanupPreviews(store: ImportStore) {
  const now = Date.now();
  const previews = store.importPreviews ?? {};
  for (const [id, preview] of Object.entries(previews)) {
    if (preview.consumed || new Date(preview.expiresAt).getTime() < now) {
      delete previews[id];
    }
  }
  store.importPreviews = previews;
}

export async function saveImportPreview(
  preview: Omit<ImportPreview, "id" | "createdAt" | "expiresAt" | "consumed">,
) {
  const id = newId("prev");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS).toISOString();
  const record: ImportPreview = {
    ...preview,
    id,
    createdAt,
    expiresAt,
    consumed: false,
  };

  await runCrmMutation((store) => {
    const s = store as ImportStore;
    cleanupPreviews(s);
    s.importPreviews = s.importPreviews ?? {};
    s.importPreviews[id] = record;
  });

  return record;
}

export async function getImportPreview(previewId: string): Promise<ImportPreview | null> {
  let preview: ImportPreview | null = null;

  await runCrmMutation((store) => {
    const s = store as ImportStore;
    cleanupPreviews(s);
    const candidate = s.importPreviews?.[previewId];
    if (!candidate || candidate.consumed) return;
    if (new Date(candidate.expiresAt).getTime() < Date.now()) return;
    preview = candidate;
  });

  return preview;
}

export async function consumeImportPreview(previewId: string): Promise<ImportPreview | null> {
  let consumed: ImportPreview | null = null;

  await runCrmMutation((store) => {
    const s = store as ImportStore;
    const preview = s.importPreviews?.[previewId];
    if (!preview || preview.consumed) return;
    preview.consumed = true;
    consumed = preview;
  });

  return consumed;
}

export async function acquireImportLock(previewId: string): Promise<boolean> {
  let acquired = false;

  await runCrmMutation((store) => {
    const s = store as ImportStore;
    const now = Date.now();
    if (s.importLock && new Date(s.importLock.until).getTime() > now) {
      return;
    }
    s.importLock = {
      previewId,
      until: new Date(now + IMPORT_LOCK_MS).toISOString(),
    };
    acquired = true;
  });

  return acquired;
}

export async function releaseImportLock(previewId: string) {
  await runCrmMutation((store) => {
    const s = store as ImportStore;
    if (s.importLock?.previewId === previewId) {
      s.importLock = null;
    }
  });
}

export async function saveImportBatch(batch: ImportBatch) {
  await runCrmMutation((store) => {
    const s = store as ImportStore;
    s.importBatches = s.importBatches ?? [];
    s.importBatches.unshift(batch);
    s.importBatches = s.importBatches.slice(0, 50);
  });
  return batch;
}

export async function updateImportBatch(batchId: string, patch: Partial<ImportBatch>) {
  let updated: ImportBatch | null = null;

  await runCrmMutation((store) => {
    const s = store as ImportStore;
    const batches = s.importBatches ?? [];
    const index = batches.findIndex((b) => b.id === batchId);
    if (index < 0) return;
    batches[index] = { ...batches[index]!, ...patch };
    s.importBatches = batches;
    updated = batches[index]!;
  });

  return updated;
}

export async function listImportBatches(limit = 20): Promise<ImportBatch[]> {
  const store = (await readCrmStore()) as ImportStore;
  return (store.importBatches ?? []).slice(0, limit);
}

export async function getImportBatch(batchId: string): Promise<ImportBatch | null> {
  const store = (await readCrmStore()) as ImportStore;
  return store.importBatches?.find((b) => b.id === batchId) ?? null;
}

export function newBatchId() {
  return newId("batch");
}
