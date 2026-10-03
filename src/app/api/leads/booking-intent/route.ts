import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  leadId: z.string().min(1),
  preferredSlot: z.string().min(1),
});

/** Logs preferred consultation slot from thank-you page (no auth — lead id is unguessable). */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = await rateLimit(`booking-intent:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { leadId, preferredSlot } = parsed.data;
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead?.formCompleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const tag = `[Preferred slot: ${preferredSlot}]`;
    const info = lead.additionalInfo?.includes(tag)
      ? lead.additionalInfo
      : lead.additionalInfo
        ? `${tag} ${lead.additionalInfo}`
        : tag;

    await db.lead.update({
      where: { id: leadId },
      data: { additionalInfo: info },
    });

    await db.activity.create({
      data: {
        leadId,
        type: "FORM_SUBMITTED",
        description: `Preferred consultation slot: ${preferredSlot}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save slot" }, { status: 500 });
  }
}
