import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActivePatientSession } from "@/lib/neuronourish-auth-session";
import { NN_PRICING } from "@/lib/neuronourish-funnel";

/** Session-protected patient profile for the consumer dashboard. */
export async function GET(request: Request) {
  const session = await getActivePatientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedLeadId = new URL(request.url).searchParams.get("leadId")?.trim();
  if (requestedLeadId && requestedLeadId !== session.leadId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await db.lead.findUnique({ where: { id: session.leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    email: lead.email,
    funnelStage: lead.funnelStage,
    primaryConcern: lead.primaryConcern,
    creditExpiryDate: lead.creditExpiryDate?.toISOString() ?? null,
    revenueEur: lead.revenueEur,
    assessmentPaidAt: lead.assessmentPaidAt?.toISOString() ?? null,
    credentialsProvisioned: Boolean(lead.passwordHash),
    programmeEnrolled:
      lead.funnelStage === "programme_enrolled" ||
      lead.revenueEur >= NN_PRICING.programmeCents / 100,
  });
}
