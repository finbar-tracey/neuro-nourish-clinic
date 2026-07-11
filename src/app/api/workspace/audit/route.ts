import { NextRequest, NextResponse } from "next/server";
import { crmScoreFromAudit, runCrmAudit } from "@/lib/crm-audit";
import { auditTestEmail } from "@/lib/broker-notify";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const sendTestEmail = body.sendTestEmail !== false;
  const cleanup = body.cleanup !== false;

  const report = await runCrmAudit({ sendTestEmail, cleanup });
  const { overall, summary } = crmScoreFromAudit(report);

  return NextResponse.json({
    ...report,
    crmScore: overall,
    summary,
  });
}

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { emailConfigured } = await import("@/lib/email");
  const testEmail = auditTestEmail();

  return NextResponse.json({
    auditAvailable: true,
    emailConfigured: emailConfigured(),
    testEmail,
    runVia: "POST /api/workspace/audit",
  });
}
