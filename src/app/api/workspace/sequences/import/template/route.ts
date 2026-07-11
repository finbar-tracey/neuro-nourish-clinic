import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { importCsvTemplate } from "@/lib/sequence-csv-import/parse-csv";
import { IMPORT_SEQUENCE_IDS } from "@/lib/sequence-csv-import/types";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const sequenceId = request.nextUrl.searchParams.get("sequenceId") ?? "lost-standard";
  if (!IMPORT_SEQUENCE_IDS.includes(sequenceId as (typeof IMPORT_SEQUENCE_IDS)[number])) {
    return NextResponse.json({ error: "Invalid sequence" }, { status: 400 });
  }

  const csv = importCsvTemplate(sequenceId);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sequence-import-${sequenceId}.csv"`,
    },
  });
}
