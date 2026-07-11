import type { Lead } from "@/generated/prisma/client";
import { cancelNurtureAndWinbackTasks } from "@/lib/cancel-sequence-tasks";
import { buildCrmBackupFileFromStore } from "@/lib/crm-backup";
import { savePreImportSnapshot } from "@/lib/crm-backup-meta";
import { db } from "@/lib/db";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import {
  buildImportLeadData,
  logImportTimeline,
  mergeImportLeadData,
} from "@/lib/sequence-csv-import/create-import-lead";
import {
  acquireImportLock,
  consumeImportPreview,
  getImportPreview,
  listImportBatches,
  newBatchId,
  releaseImportLock,
  saveImportBatch,
  updateImportBatch,
} from "@/lib/sequence-csv-import/import-batch-store";
import { isEnrollOutcome, resolveImportRows } from "@/lib/sequence-csv-import/resolve-outcome";
import {
  ATTESTATION_VERSION,
  type ImportBatch,
  type ImportSequenceId,
  type LawfulBasis,
  type ResolvedImportRow,
} from "@/lib/sequence-csv-import/types";
import { enrollWinback } from "@/lib/winback-sequence";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareLeadForImport(
  resolved: ResolvedImportRow,
  batchId: string,
  campaign: string,
  lawfulBasis: LawfulBasis,
  sequenceId: ImportSequenceId,
): Promise<{ lead: Lead; created: boolean }> {
  const { row, outcome, existingLeadId } = resolved;

  if (outcome === "CREATE_ENROLL") {
    const lead = await db.lead.create({
      data: buildImportLeadData(row, batchId, campaign, lawfulBasis, sequenceId),
    });
    await logImportTimeline(lead.id, batchId, campaign);
    return { lead, created: true };
  }

  if (!existingLeadId) {
    throw new Error(`Missing lead id for ${outcome}`);
  }

  const existing = await db.lead.findUnique({ where: { id: existingLeadId } });
  if (!existing) {
    throw new Error(`Lead not found: ${existingLeadId}`);
  }

  await cancelNurtureAndWinbackTasks(existing.id);
  const lead = await db.lead.update({
    where: { id: existing.id },
    data: mergeImportLeadData(existing, row, batchId, campaign, lawfulBasis, sequenceId),
  });
  await logImportTimeline(lead.id, batchId, campaign);
  return { lead, created: outcome === "MERGE_ENROLL" };
}

export async function commitSequenceImport(input: {
  previewId: string;
  lawfulBasis: LawfulBasis;
  attestationAccepted: boolean;
}): Promise<{ batch: ImportBatch; error?: string }> {
  if (!input.attestationAccepted) {
    throw new Error("Attestation is required");
  }

  const existingBatch = await getImportBatchByPreview(input.previewId);
  if (existingBatch) {
    return { batch: existingBatch };
  }

  const preview = await getImportPreview(input.previewId);
  if (!preview) {
    throw new Error("Preview expired or not found — upload again");
  }

  const lockOk = await acquireImportLock(input.previewId);
  if (!lockOk) {
    throw new Error("Another import is in progress — try again shortly");
  }

  const batchId = newBatchId();
  const preBackup = await buildCrmBackupFileFromStore();
  const preBackupAt = new Date().toISOString();
  const createdLeadIds: string[] = [];
  const enrolledLeadIds: string[] = [];
  const outcomes: ImportBatch["outcomes"] = { ...preview.summary };

  let batch: ImportBatch = {
    id: batchId,
    previewId: input.previewId,
    sequenceId: preview.sequenceId,
    campaign: preview.campaign,
    lawfulBasis: input.lawfulBasis,
    fileName: preview.fileName,
    rowCount: preview.rows.length,
    enrolled: 0,
    skipped: preview.summary.skipped,
    failed: 0,
    outcomes,
    leadIds: [],
    createdLeadIds: [],
    status: "enrolling",
    error: null,
    attestationVersion: ATTESTATION_VERSION,
    attestationAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: "Daniel",
    preBackupChecksum: preBackup.checksumSha256,
    preBackupAt,
  };

  await savePreImportSnapshot({
    batchId,
    createdAt: preBackupAt,
    checksumSha256: preBackup.checksumSha256,
    store: JSON.parse(JSON.stringify(preBackup.store)) as typeof preBackup.store,
  });

  await saveImportBatch(batch);

  const enrollRows = preview.rows.filter((r) => isEnrollOutcome(r.outcome));
  const leads = await db.lead.findMany();
  const revalidated = resolveImportRows(
    enrollRows.map((r) => r.row),
    leads,
    preview.sequenceId,
  );

  for (const [index, original] of enrollRows.entries()) {
    const current = revalidated.resolved[index];
    if (!current || current.outcome !== original.outcome) {
      await rollbackCreatedLeads(createdLeadIds);
      await updateImportBatch(batchId, {
        status: "failed",
        error: "Store changed during import — re-preview required",
        failed: enrollRows.length,
      });
      await releaseImportLock(input.previewId);
      throw new Error("Store changed during import — re-preview required");
    }
  }

  try {
    for (const [index] of enrollRows.entries()) {
      if (index > 0) await sleep(2000);

      const resolved = revalidated.resolved[index]!;
      const { lead, created } = await prepareLeadForImport(
        resolved,
        batchId,
        preview.campaign,
        input.lawfulBasis,
        preview.sequenceId,
      );

      if (created) createdLeadIds.push(lead.id);

      try {
        await enrollWinback(lead);
        enrolledLeadIds.push(lead.id);
      } catch (error) {
        await rollbackCreatedLeads(createdLeadIds);
        const message = error instanceof Error ? error.message : "Enrollment failed";
        await updateImportBatch(batchId, {
          status: "failed",
          error: message,
          failed: enrollRows.length - enrolledLeadIds.length,
          enrolled: enrolledLeadIds.length,
          leadIds: enrolledLeadIds,
          createdLeadIds,
        });
        await releaseImportLock(input.previewId);
        throw new Error(message);
      }
    }

    await consumeImportPreview(input.previewId);

    batch = (await updateImportBatch(batchId, {
      status: "completed",
      enrolled: enrolledLeadIds.length,
      leadIds: enrolledLeadIds,
      createdLeadIds,
      error: null,
    })) ?? {
      ...batch,
      status: "completed",
      enrolled: enrolledLeadIds.length,
      leadIds: enrolledLeadIds,
      createdLeadIds,
      error: null,
    };

    await releaseImportLock(input.previewId);
    return { batch };
  } catch (error) {
    await releaseImportLock(input.previewId);
    throw error;
  }
}

async function rollbackCreatedLeads(leadIds: string[]) {
  for (const id of leadIds) {
    await deleteLeadCase(id).catch(() => null);
  }
}

async function getImportBatchByPreview(previewId: string): Promise<ImportBatch | null> {
  const batches = await listImportBatches(50);
  return batches.find((b) => b.previewId === previewId && b.status === "completed") ?? null;
}
