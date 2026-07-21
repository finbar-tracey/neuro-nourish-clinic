import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nnIsAssessmentPaid } from "@/lib/neuronourish-workspace";

/**
 * Prefill assessment checkout fields for an existing lead (quiz → shop).
 * Returns only non-sensitive contact fields — never DOB.
 */
export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get("leadId")?.trim() ?? "";
  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone && lead.phone !== "not_provided" ? lead.phone : null,
    hasDateOfBirth: Boolean(lead.dateOfBirth),
    assessmentAlreadyPaid: nnIsAssessmentPaid(lead),
  });
}
