import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeLeadId } from "@/lib/sms-links";

/** Minimal public lead session for SMS deep-links (unguessable lead id). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = clientIp(request);
  const limited = await rateLimit(`lead-session:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id: rawId } = await params;
  const id = normalizeLeadId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: lead.id,
    firstName: lead.firstName,
    loanAmount: lead.loanAmount,
    loanPurpose: lead.loanPurpose,
    timeframe: lead.timeframe,
    propertyType: lead.propertyType,
    propertyLocation: lead.propertyLocation,
    formCompleted: lead.formCompleted,
  });
}
