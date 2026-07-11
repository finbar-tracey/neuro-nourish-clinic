import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  bookPriorityCall,
  PriorityCallBookingError,
} from "@/lib/priority-call-booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  leadId: z.string().min(1),
  slotId: z.string().min(1),
  metaEventId: z.string().optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  landingPageUrl: z.string().optional(),
});

/** Books a priority consultation call — emails + SMS to lead and Daniel. */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = await rateLimit(`book-call:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { leadId, slotId, metaEventId, fbp, fbc, landingPageUrl } = parsed.data;
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead?.formCompleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const result = await bookPriorityCall(lead, slotId, {
      eventId: metaEventId,
      fbp,
      fbc,
      sourceUrl: landingPageUrl,
      clientIp: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      slotLabel: result.slotLabel,
      displayTime: result.displayTime,
      teamsLink: result.teamsLink,
      notifications: {
        leadEmail: result.leadEmailSent,
        leadSms: result.leadSmsSent,
        brokerEmail: result.brokerEmailSent,
        brokerSms: result.brokerSmsSent,
      },
    });
  } catch (error) {
    if (error instanceof PriorityCallBookingError) {
      const status =
        error.code === "LEAD_NOT_FOUND"
          ? 404
          : error.code === "SLOT_TAKEN" || error.code === "CALENDAR_BUSY"
            ? 409
            : 400;
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "Failed to book priority call" }, { status: 500 });
  }
}
