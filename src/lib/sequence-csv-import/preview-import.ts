import { db } from "@/lib/db";
import { parseImportCsv, slugifyCampaign } from "@/lib/sequence-csv-import/parse-csv";
import { saveImportPreview } from "@/lib/sequence-csv-import/import-batch-store";
import { resolveImportRows } from "@/lib/sequence-csv-import/resolve-outcome";
import {
  IMPORT_SEQUENCE_IDS,
  type ImportSequenceId,
} from "@/lib/sequence-csv-import/types";

export async function buildSequenceImportPreview(input: {
  csvText: string;
  sequenceId: ImportSequenceId;
  campaign: string;
  fileName?: string | null;
}) {
  if (!IMPORT_SEQUENCE_IDS.includes(input.sequenceId)) {
    throw new Error("Invalid sequence");
  }

  const campaign = slugifyCampaign(input.campaign);
  if (!campaign) {
    throw new Error("Campaign name is required");
  }

  const { rows, errors } = parseImportCsv(input.csvText);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  if (rows.length === 0) {
    throw new Error("No importable rows found");
  }

  const leads = await db.lead.findMany();
  const { resolved, summary } = resolveImportRows(rows, leads, input.sequenceId);

  return saveImportPreview({
    sequenceId: input.sequenceId,
    campaign,
    fileName: input.fileName ?? null,
    rows: resolved,
    summary,
  });
}
