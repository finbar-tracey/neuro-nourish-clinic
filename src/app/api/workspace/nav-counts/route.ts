import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { loadWorkspaceCases } from "@/lib/workspace-cases-cache";
import { queueNavCounts } from "@/lib/workspace-case";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const cases = await loadWorkspaceCases();
  const counts = queueNavCounts(cases);

  return NextResponse.json(
    { counts, alerts: { atRisk: counts.atRisk } },
    {
      headers: {
        "Cache-Control": "private, max-age=0, stale-while-revalidate=5",
      },
    },
  );
}
