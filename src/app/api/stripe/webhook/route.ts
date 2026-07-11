import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { cancelSequenceTasksByPrefix } from "@/lib/cancel-sequence-tasks";
import { resolveCnsAssessmentTestUrl } from "@/lib/cnsvitalsigns";
import {
  cancelBloodSugarNewsletterSeries,
  cancelGutBrainNewsletterSeries,
  cancelOnboardingWelcomeNurture,
  cancelProgrammeNurture,
  enrollNeuronourishNurture,
  sendAssessmentInstructionsEmail,
} from "@/lib/neuronourish-nurture";
import { funnelStageLabel, NN_PRICING } from "@/lib/neuronourish-funnel";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import type { NnFunnelStage } from "@/lib/neuronourish-funnel";
import { sendNeuronourishPartnerAlert, sendSlackAlert } from "@/lib/neuronourish-notifications";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { buildMetaServerPurchasePayload } from "@/lib/meta-tracking";
import { siteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";
import { format } from "date-fns";

export async function POST(request: Request) {
  const stripeKey = runtimeSecret("STRIPE_SECRET_KEY");
  const webhookSecret = runtimeSecret("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { leadId?: string; product?: string; funnelStage?: string };
      amount_total?: number | null;
    };
    const leadId = session.metadata?.leadId;
    const parsedValue = session.amount_total ? session.amount_total / 100 : 0;
    const tier =
      session.metadata?.product === "programme" ? "programme_enrolled" : "assessment_purchased";
    if (leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (lead) {
        const patch = nnOperationalPatchForStage(tier as NnFunnelStage);
        const updated = await db.lead.update({
          where: { id: leadId },
          data: patch,
        });

        const purchasePayload = buildMetaServerPurchasePayload(
          updated.id,
          parsedValue,
          updated.email,
        );

        await db.note.create({
          data: {
            leadId: updated.id,
            author: "System",
            content: `Meta Conversion Event payload calculated for Purchase value: €${parsedValue} EUR. Dispatching tracking packets.`,
          },
        });

        void sendMetaCapiEvent("Purchase", {
          leadId: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          eventId: purchasePayload.event_id,
          loanAmount: parsedValue,
          currency: "EUR",
          contentName:
            tier === "programme_enrolled"
              ? "12-Month Personalised Brain Health Programme"
              : "Scientific Cognitive Baseline Assessment",
          contentType: "product",
          sourceUrl: `${siteUrl()}/${tier === "programme_enrolled" ? "programme" : "assessment"}/success`,
        });

        await logCaseTimeline(
          lead.id,
          "STAGE_CHANGED",
          `Payment complete — ${funnelStageLabel(tier)}`,
          "System",
        );
        void sendNeuronourishPartnerAlert(updated);

        if (tier === "assessment_purchased") {
          void sendSlackAlert("ASSESSMENT_PAID", {
            name: `${updated.firstName} ${updated.lastName}`.trim(),
            email: updated.email,
            extra: `€90 Scientific Cognitive Baseline Assessment · CRM: ${siteUrl()}/workspace/cases/${updated.id}`,
          });
          await cancelSequenceTasksByPrefix(updated.id, "NN nurture [discovery_post_call]");
          await cancelSequenceTasksByPrefix(updated.id, "NN nurture [missed_discovery_call]");
          await cancelBloodSugarNewsletterSeries(updated.id);
          await cancelGutBrainNewsletterSeries(updated.id);
          void enrollNeuronourishNurture(updated, "assessment_complete");

          console.log(`[AUTOMATION] Dispatching CNS credential creation for lead: ${updated.id}`);
          const { testUrl, registration } = await resolveCnsAssessmentTestUrl(
            updated.id,
            updated.email,
          );

          if (!registration.success) {
            await db.note.create({
              data: {
                leadId: updated.id,
                author: "System",
                content: `CNS API registration failure. Automated instructions fell back to standard systemic URL. Reason: ${registration.error ?? "Unknown tracking exception"}`,
              },
            });
          }

          const expiryDateString = updated.creditExpiryDate
            ? format(new Date(updated.creditExpiryDate), "dd MMM yyyy")
            : format(
                new Date(Date.now() + NN_PRICING.assessmentCreditDays * 24 * 60 * 60 * 1000),
                "dd MMM yyyy",
              );

          await sendAssessmentInstructionsEmail({
            email: updated.email,
            firstName: updated.firstName,
            expiryDateString,
            testUrl,
            leadId: updated.id,
          });

          await db.note.create({
            data: {
              leadId: lead.id,
              author: "System",
              content: `[Credit] €90 assessment fee credited toward programme if enrolled within ${NN_PRICING.assessmentCreditDays} days (expires ${patch.creditExpiryDate?.toISOString().slice(0, 10) ?? "—"}). CNS test URL dispatched.`,
            },
          });

          console.log("[AUTOMATION COMPLETE] Assessment token delivery loop executed.");
        } else if (tier === "programme_enrolled") {
          await cancelSequenceTasksByPrefix(updated.id, "NN nurture [discovery_post_call]");
          await cancelBloodSugarNewsletterSeries(updated.id);
          await cancelGutBrainNewsletterSeries(updated.id);
          await cancelOnboardingWelcomeNurture(updated.id);
          await cancelProgrammeNurture(updated.id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
