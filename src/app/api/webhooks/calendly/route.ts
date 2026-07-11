import { NextResponse } from "next/server";
import { logCaseTimeline } from "@/lib/case-engine";
import {
  readCalendlySignatureHeader,
  verifyCalendlyWebhookSignature,
} from "@/lib/calendly-webhook";
import { db } from "@/lib/db";
import {
  cancelClinicianBriefingFollowup,
  cancelEnterpriseBriefingNurture,
  cancelMissedDiscoveryCallNurture,
  cancelMissedB2BBriefingNurture,
  cancelBloodSugarNewsletterSeries,
  cancelGutBrainNewsletterSeries,
  cancelOnboardingWelcomeNurture,
} from "@/lib/neuronourish-nurture";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import { sendPartnerAlert } from "@/lib/neuronourish-notifications";
import { runtimeSecret } from "@/lib/runtime-env";

type CalendlyPayload = {
  event?: string;
  payload?: {
    email?: string;
    name?: string;
    created_at?: string;
    scheduled_event?: { start_time?: string };
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signingKey = runtimeSecret("CALENDLY_WEBHOOK_SIGNING_KEY");
    const signature = readCalendlySignatureHeader(request);

    if (signingKey && !verifyCalendlyWebhookSignature(rawBody, signature, signingKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as CalendlyPayload;
    const eventType = body.event;

    if (eventType !== "invitee.created") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const invitee = body.payload;
    const email = invitee?.email?.trim().toLowerCase();
    const name = invitee?.name?.trim();
    const bookedAtRaw = invitee?.scheduled_event?.start_time ?? invitee?.created_at;
    const bookedAt = bookedAtRaw ? new Date(bookedAtRaw) : new Date();

    if (!email) {
      return NextResponse.json({ error: "Missing identifier email" }, { status: 400 });
    }

    const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
    const matchingLead = leads.find((l) => l.email.toLowerCase() === email);

    if (!matchingLead) {
      return NextResponse.json({ received: true, matched: false }, { status: 200 });
    }

    const patch = nnOperationalPatchForStage("discovery_requested", {
      discoveryBookedAt: bookedAt,
      pipelineValueEur: 3550,
    });

    await db.lead.update({
      where: { id: matchingLead.id },
      data: patch,
    });

    await cancelClinicianBriefingFollowup(matchingLead.id);
    await cancelEnterpriseBriefingNurture(matchingLead.id);
    await cancelMissedDiscoveryCallNurture(matchingLead.id);
    await cancelMissedB2BBriefingNurture(matchingLead.id);
    await cancelBloodSugarNewsletterSeries(matchingLead.id);
    await cancelGutBrainNewsletterSeries(matchingLead.id);
    await cancelOnboardingWelcomeNurture(matchingLead.id);

    await logCaseTimeline(
      matchingLead.id,
      "STAGE_CHANGED",
      `Discovery call booked via Calendly${name ? ` — ${name}` : ""}`,
      "System",
    );

    await sendPartnerAlert({
      type: "DISCOVERY_BOOKED",
      name: name ?? `${matchingLead.firstName} ${matchingLead.lastName}`,
      email,
      leadId: matchingLead.id,
      details:
        "Discovery consultation confirmed via Calendly. Dashboard record updated automatically.",
    });

    return NextResponse.json({ success: true, leadId: matchingLead.id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    console.error("Calendly webhook failure:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
