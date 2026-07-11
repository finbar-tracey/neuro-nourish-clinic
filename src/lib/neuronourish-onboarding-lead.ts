import { db } from "@/lib/db";

/** Resolve a lead by id or case-insensitive email (newest match). */
export async function resolveOnboardingLead(leadId?: string, email?: string) {
  if (leadId) {
    const byId = await db.lead.findUnique({ where: { id: leadId } });
    if (byId) return byId;
  }
  if (email) {
    const normalized = email.trim().toLowerCase();
    const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
    return leads.find((l) => l.email.toLowerCase() === normalized) ?? null;
  }
  return null;
}
