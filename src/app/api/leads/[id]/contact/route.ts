import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { logContactAttempt } from "@/lib/contact-logging";
import { db } from "@/lib/db";

const schema = z.object({
  channel: z.enum(["call", "sms", "email", "whatsapp"]),
  outcome: z.enum(["attempted", "no_answer", "connected", "sent"]).optional(),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const updated = await logContactAttempt(lead, parsed.data);

  return NextResponse.json({
    ok: true,
    responseTimeMinutes: updated.responseTimeMinutes,
    firstResponseAt: updated.firstResponseAt,
    conversationStarted: updated.conversationStarted,
  });
}
