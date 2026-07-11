import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { clearDemoData, hasDemoData, isCrmEmpty, seedDemoData } from "@/lib/demo-data";
import { clearWorkspaceData } from "@/lib/crm-persistence";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const empty = await isCrmEmpty();
  const hasDemo = await hasDemoData();
  const count = await db.lead.count();

  return NextResponse.json({ empty, hasDemo, count });
}

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  let force = false;
  try {
    const body = await request.json();
    force = Boolean(body?.force);
  } catch {
    // no body — default seed
  }

  const result = await seedDemoData({ force });
  const { invalidateWorkspaceCasesCache } = await import("@/lib/workspace-cases-cache");
  invalidateWorkspaceCasesCache();
  return NextResponse.json({ ok: true, ...result });
}

export async function DELETE(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const scope = request.nextUrl.searchParams.get("scope");
  if (scope === "all") {
    const summary = await clearWorkspaceData();
    const { invalidateWorkspaceCasesCache } = await import("@/lib/workspace-cases-cache");
    invalidateWorkspaceCasesCache();
    return NextResponse.json({
      ok: true,
      message: "Workspace cleared",
      ...summary,
    });
  }

  await clearDemoData();
  const { invalidateWorkspaceCasesCache } = await import("@/lib/workspace-cases-cache");
  invalidateWorkspaceCasesCache();
  return NextResponse.json({ ok: true, message: "Demo data cleared" });
}
