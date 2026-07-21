import { NextRequest, NextResponse } from "next/server";
import { issueCnsRemoteTest } from "@/lib/cns-pipeline";
import { validateDobForCns } from "@/lib/cnsvitalsigns";
import { db } from "@/lib/db";
import { nnIsAssessmentPaid } from "@/lib/neuronourish-workspace";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string;
    dateOfBirth?: string;
  };

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  const dobRaw = typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";

  if (!leadId || !dobRaw) {
    return NextResponse.json({ error: "leadId and dateOfBirth are required" }, { status: 400 });
  }

  // Expect YYYY-MM-DD from <input type="date">
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
    return NextResponse.json({ error: "Use date format YYYY-MM-DD" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!nnIsAssessmentPaid(lead)) {
    return NextResponse.json(
      { error: "Assessment purchase required before unlocking the test" },
      { status: 403 },
    );
  }

  const dob = new Date(`${dobRaw}T00:00:00.000Z`);
  const dobError = validateDobForCns(dob);
  if (dobError) {
    return NextResponse.json({ error: dobError }, { status: 400 });
  }

  await db.lead.update({
    where: { id: leadId },
    data: { dateOfBirth: dob },
  });

  const result = await issueCnsRemoteTest(leadId);

  // DOB is saved even when CNS issue fails (e.g. CNSVS_LIVE off) — surface that clearly.
  if (!result.ok && result.status === "failed") {
    return NextResponse.json(
      {
        ok: false,
        dobSaved: true,
        error: result.error ?? "Could not issue CNS test",
        status: result.status,
        message:
          "Date of birth saved. Your test link could not be issued automatically — our care team will follow up.",
      },
      { status: 502 },
    );
  }

  if (!result.ok && result.status === "pending_dob") {
    return NextResponse.json({ error: result.error ?? "Invalid date of birth" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    testUrl: result.testUrl,
    message:
      result.status === "awaiting_report"
        ? "Check your email for assessment instructions."
        : "Request received.",
  });
}
