import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { loadWorkspaceCases } from "@/lib/workspace-cases-cache";
import { buildOperationalPayload } from "@/lib/workspace-operational-response";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const allCases = await loadWorkspaceCases();
  const payload = buildOperationalPayload(allCases);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=0, stale-while-revalidate=5",
    },
  });
}
