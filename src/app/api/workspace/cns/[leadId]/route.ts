import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { approveAndSendCnsSummary, issueCnsRemoteTest } from "@/lib/cns-pipeline";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { leadId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action ?? "";

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "reissue") {
    await db.lead.update({
      where: { id: leadId },
      data: {
        cnsRemoteId: null,
        cnsTestUrl: null,
        cnsSyncId: null,
        cnsLastError: null,
      },
    });
    const result = await issueCnsRemoteTest(leadId, { forceReissue: true });
    return NextResponse.json(result);
  }

  if (action === "approve_summary") {
    const result = await approveAndSendCnsSummary(leadId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
