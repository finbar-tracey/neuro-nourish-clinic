import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { listImportBatches } from "@/lib/sequence-csv-import/import-batch-store";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const batches = await listImportBatches(Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({ batches });
}
