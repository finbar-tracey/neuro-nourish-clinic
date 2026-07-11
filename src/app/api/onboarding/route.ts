import { NextResponse } from "next/server";
import { z } from "zod";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { resolveOnboardingLead } from "@/lib/neuronourish-onboarding-lead";
import { enrollOnboardingWelcomeNurture, enrollProgrammeNurture } from "@/lib/neuronourish-nurture";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import { sendSlackAlert } from "@/lib/neuronourish-notifications";

const onboardingSchema = z.object({
  leadId: z.string().optional(),
  email: z.string().email().optional(),
  primaryConcern: z.string().optional(),
  syncTokens: z
    .object({
      sleep: z.boolean().optional(),
      movement: z.boolean().optional(),
      messaging: z.boolean().optional(),
      "coach-messaging": z.boolean().optional(),
    })
    .optional(),
});

const GOAL_TO_CONCERN: Record<string, string> = {
  memory: "memory",
  memory_loss: "memory",
  "brain-fog": "focus",
  brain_fog: "focus",
  prevention: "prevention",
  family_history: "prevention",
  "executive-stamina": "focus",
  cognitive_stamina: "focus",
};

function formatSyncStatus(enabled: boolean) {
  return enabled ? "CONNECTED" : "DISABLED";
}

/** Persist consumer onboarding wizard selections to CRM. */
export async function POST(request: Request) {
  try {
    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
    }

    const { leadId, email, primaryConcern, syncTokens } = parsed.data;
    if (!leadId && !email) {
      return NextResponse.json({ error: "Missing customer identifier (leadId or email)" }, { status: 400 });
    }

    const lead = await resolveOnboardingLead(leadId, email);
    if (!lead) {
      return NextResponse.json({ error: "Matching patient profile not found" }, { status: 404 });
    }

    const tokens = syncTokens ?? {};
    const messaging = tokens.messaging ?? tokens["coach-messaging"] ?? false;
    const mappedConcern =
      (primaryConcern && GOAL_TO_CONCERN[primaryConcern]) || primaryConcern || lead.primaryConcern;

    const noteContent = `Onboarding completed. App integration targets initialized: Sleep tracking (${formatSyncStatus(Boolean(tokens.sleep))}), Movement analytics (${formatSyncStatus(Boolean(tokens.movement))}), Messaging links (${formatSyncStatus(messaging)}). Primary cognitive goal: ${primaryConcern ?? "unset"}.`;

    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        primaryConcern: mappedConcern ?? lead.primaryConcern,
        formCompleted: true,
        ...nnOperationalPatchForStage("onboarding_completed"),
        additionalInfo: lead.additionalInfo
          ? `${lead.additionalInfo}\n[NeuroNourish] Consumer onboarding complete`
          : "[NeuroNourish] Consumer onboarding complete",
      },
    });

    await db.note.create({
      data: {
        leadId: lead.id,
        content: noteContent,
        author: "System Automation",
      },
    });

    await logCaseTimeline(
      lead.id,
      "FORM_SUBMITTED",
      "Consumer onboarding wizard completed",
      "System",
    );

    void sendSlackAlert("ASSESSMENT_PAID", {
      name: `${updatedLead.firstName} ${updatedLead.lastName}`.trim(),
      email: updatedLead.email,
      extra: `Onboarding wizard complete. Core target set to: ${(primaryConcern ?? mappedConcern ?? "general").replace(/-/g, " ")}`,
    });

    console.log(
      `[AUTOMATION ENROLLMENT] Initializing 12-month upgrade and credit expiry tracking for: ${updatedLead.id}`,
    );
    void enrollProgrammeNurture(updatedLead);

    console.log(
      `[AUTOMATION ENROLLMENT] Initializing post-onboarding welcome sequence for: ${updatedLead.id}`,
    );
    void enrollOnboardingWelcomeNurture(updatedLead);

    return NextResponse.json({ success: true, leadId: updatedLead.id }, { status: 200 });
  } catch (error) {
    console.error("Onboarding persistence layer failure:", error);
    const message = error instanceof Error ? error.message : "Onboarding save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
