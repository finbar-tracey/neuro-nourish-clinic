import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { MAX_IMPORT_BYTES } from "@/lib/sequence-csv-import/types";
import { buildSequenceImportPreview } from "@/lib/sequence-csv-import/preview-import";
import { IMPORT_SEQUENCE_IDS, type ImportSequenceId } from "@/lib/sequence-csv-import/types";
import { slugifyCampaign } from "@/lib/sequence-csv-import/parse-csv";

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let csvText = "";
    let sequenceId: ImportSequenceId = "lost-standard";
    let campaign = "";
    let fileName: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      sequenceId = String(form.get("sequenceId") ?? "lost-standard") as ImportSequenceId;
      campaign = String(form.get("campaign") ?? "");
      if (file instanceof File) {
        if (file.size > MAX_IMPORT_BYTES) {
          return NextResponse.json({ error: "File too large (max 1 MB)" }, { status: 400 });
        }
        csvText = await file.text();
        fileName = file.name;
      } else {
        return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
      }
    } else {
      const body = (await request.json()) as {
        csvText?: string;
        sequenceId?: ImportSequenceId;
        campaign?: string;
        fileName?: string;
      };
      csvText = body.csvText ?? "";
      sequenceId = body.sequenceId ?? "lost-standard";
      campaign = body.campaign ?? "";
      fileName = body.fileName ?? null;
    }

    if (!IMPORT_SEQUENCE_IDS.includes(sequenceId)) {
      return NextResponse.json({ error: "Invalid sequence" }, { status: 400 });
    }

    if (!slugifyCampaign(campaign)) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const preview = await buildSequenceImportPreview({
      csvText,
      sequenceId,
      campaign,
      fileName,
    });

    return NextResponse.json({
      previewId: preview.id,
      expiresAt: preview.expiresAt,
      sequenceId: preview.sequenceId,
      campaign: preview.campaign,
      fileName: preview.fileName,
      summary: preview.summary,
      rows: preview.rows.map((r) => ({
        line: r.row.line,
        email: r.row.email,
        name: `${r.row.firstName} ${r.row.lastName}`.trim(),
        outcome: r.outcome,
        detail: r.detail,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 400 },
    );
  }
}
