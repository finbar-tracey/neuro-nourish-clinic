import { NextResponse } from "next/server";
import { z } from "zod";
import { logCaseTimeline } from "@/lib/case-engine";
import { resolveOnboardingLead } from "@/lib/neuronourish-onboarding-lead";
import {
  createPatientSession,
  patientSessionFromLead,
} from "@/lib/neuronourish-auth-session";
import { verifyPasswordSecurely } from "@/lib/password-credentials";

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(1),
    leadId: z.string().optional(),
  })
  .refine((data) => Boolean(data.email || data.leadId), {
    message: "Missing authorization parameters.",
  });

/** Validate portal credentials and issue an HTTP-only session cookie. */
export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Missing authorization parameters." },
        { status: 400 },
      );
    }

    const email = parsed.data.email?.trim().toLowerCase();
    const { password, leadId } = parsed.data;

    const lead = await resolveOnboardingLead(leadId, email);
    if (!lead?.passwordHash || !lead.passwordSalt) {
      return NextResponse.json(
        { error: "Invalid identification email address or secure password profile." },
        { status: 401 },
      );
    }

    const isMatch = verifyPasswordSecurely(password, lead.passwordHash, lead.passwordSalt);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid identification email address or secure password profile." },
        { status: 401 },
      );
    }

    await createPatientSession(patientSessionFromLead(lead));

    await logCaseTimeline(
      lead.id,
      "FORM_SUBMITTED",
      "Portal authentication successful. Cryptographic session cookie issued.",
      "System",
    );

    return NextResponse.json(
      {
        success: true,
        message: "Authentication successful.",
        patientId: lead.id,
        patientProfile: {
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          email: lead.email,
          funnelStage: lead.funnelStage,
          primaryConcern: lead.primaryConcern,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PORTAL AUTHENTICATION TERMINAL ERROR]", error);
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
