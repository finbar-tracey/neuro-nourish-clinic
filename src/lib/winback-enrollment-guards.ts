import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { canEnrollWinback } from "@/lib/winback-eligibility";

const ACTIVE_STATUSES = new Set(["NEW", "CONTACTED", "BOOKED", "FOLLOW_UP"]);

export function enrollmentBlockReason(lead: Lead, allLeads: Lead[]): string | null {
  if (lead.status !== "LOST") {
    return "Win-back is only available for lost cases";
  }
  if (!canEnrollWinback(lead.lostReason)) {
    return "This lost reason is not eligible for win-back";
  }

  const normalized = lead.email.trim().toLowerCase();
  const duplicateActive = allLeads.find(
    (other) =>
      other.id !== lead.id &&
      other.email.trim().toLowerCase() === normalized &&
      ACTIVE_STATUSES.has(other.status),
  );

  if (duplicateActive) {
    return "Another active case exists for this email — resolve it first";
  }

  return null;
}

export async function assertWinbackEnrollmentAllowed(lead: Lead) {
  const allLeads = await db.lead.findMany();
  const reason = enrollmentBlockReason(lead, allLeads);
  if (reason) throw new Error(reason);
}
