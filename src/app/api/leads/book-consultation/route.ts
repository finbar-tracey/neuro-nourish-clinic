import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { findSlotByLabel } from "@/lib/priority-slots";
import {
  bookPriorityCall,
  PriorityCallBookingError,
} from "@/lib/priority-call-booking";

const schema = z.object({
  leadId: z.string().min(1),
  preferredSlot: z.string().min(1),
});

/** @deprecated Use POST /api/book-priority-call — kept for backwards compatibility. */
export async function POST(request: Request) {
  try {
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

    const slot = findSlotByLabel(preferredSlot);
    if (!slot) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 });
    }

    const result = await bookPriorityCall(lead, slot.id);

    return NextResponse.json({
      ok: true,
      slotLabel: result.slotLabel,
      displayTime: result.displayTime,
      hasBookingUrl: false,
      emailsSent: result.leadEmailSent && result.brokerEmailSent,
    });
  } catch (error) {
    if (error instanceof PriorityCallBookingError) {
      const status =
        error.code === "LEAD_NOT_FOUND"
          ? 404
          : error.code === "SLOT_TAKEN" || error.code === "CALENDAR_BUSY"
            ? 409
            : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
