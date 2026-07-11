import { NextResponse } from "next/server";
import { z } from "zod";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { resolveOnboardingLead } from "@/lib/neuronourish-onboarding-lead";
import { hashPasswordSecurely } from "@/lib/password-credentials";

const authSchema = z.object({
  leadId: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8, "Password fails minimum 8-character validation check."),
});

const ONBOARDING_ELIGIBLE_STAGES = new Set([
  "assessment_purchased",
  "assessment_completed",
  "onboarding_started",
  "programme_offered",
]);

/** Provision hashed portal credentials during onboarding Step 1. */
export async function POST(request: Request) {
  try {
    const parsed = authSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Password fails minimum 8-character validation check.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { leadId, email, password } = parsed.data;
    if (!leadId && !email) {
      return NextResponse.json(
        { error: "Missing customer identifier (leadId or email)" },
        { status: 400 },
      );
    }

    const lead = await resolveOnboardingLead(leadId, email);
    if (!lead) {
      return NextResponse.json(
        { error: "Matching patient profile not found for authorization." },
        { status: 404 },
      );
    }

    const { hash, salt } = hashPasswordSecurely(password);
    const stage = lead.funnelStage ?? "";
    const funnelStage = ONBOARDING_ELIGIBLE_STAGES.has(stage) ? "onboarding_started" : stage;

    await db.lead.update({
      where: { id: lead.id },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
        ...(funnelStage !== stage ? { funnelStage } : {}),
      },
    });

    await db.note.create({
      data: {
        leadId: lead.id,
        content: "Customer account credentials generated. Secure dashboard access initialized.",
        author: "Security Service",
      },
    });

    await logCaseTimeline(
      lead.id,
      "FORM_SUBMITTED",
      "Consumer portal credentials provisioned",
      "System",
    );

    return NextResponse.json(
      { success: true, message: "Credentials generated successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[AUTH PROVISIONING FAILURE]", error);
    const message = error instanceof Error ? error.message : "Credential provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
