import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { cancelSequenceTasksByPrefix } from "@/lib/cancel-sequence-tasks";
import { ensureCnsSubjectId, issueCnsRemoteTest } from "@/lib/cns-pipeline";
import {
  cancelBloodSugarNewsletterSeries,
  cancelGutBrainNewsletterSeries,
  cancelOnboardingWelcomeNurture,
  cancelProgrammeNurture,
  enrollNeuronourishNurture,
} from "@/lib/neuronourish-nurture";
import { funnelStageLabel, NN_PRICING } from "@/lib/neuronourish-funnel";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import type { NnFunnelStage } from "@/lib/neuronourish-funnel";
import { sendNeuronourishPartnerAlert, sendSlackAlert } from "@/lib/neuronourish-notifications";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { buildMetaServerPurchasePayload } from "@/lib/meta-tracking";
import { getShopProduct } from "@/lib/neuronourish-shop";
import { siteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";

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
      id?: string;
      metadata?: {
        leadId?: string;
        product?: string;
        funnelStage?: string;
        crmTag?: string;
        legacyProduct?: string;
      };
      amount_total?: number | null;
    };
    const leadId = session.metadata?.leadId;
    const parsedValue = session.amount_total ? session.amount_total / 100 : 0;
    const productKey = session.metadata?.product || session.metadata?.legacyProduct || "";
    const shopProduct = getShopProduct(productKey);
    const crmTag = session.metadata?.crmTag || shopProduct?.crmTag || `shop_${productKey}`;
    const tier: NnFunnelStage =
      (session.metadata?.funnelStage as NnFunnelStage) ||
      shopProduct?.funnelStage ||
      (productKey === "programme" ? "programme_enrolled" : "assessment_purchased");

    if (leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (lead) {
        const patch =
          tier === "assessment_purchased" || tier === "programme_enrolled"
            ? nnOperationalPatchForStage(tier)
            : {
                funnelStage: tier,
                status: "CONTACTED" as const,
                nextAction: `Fulfil shop purchase · ${crmTag}`,
                pipelineValueEur: parsedValue || undefined,
              };

        const updated = await db.lead.update({
          where: { id: leadId },
          data: {
            ...patch,
            additionalInfo: `${lead.additionalInfo ?? ""}\n[Shop] Paid · ${crmTag} · €${parsedValue}${session.id ? ` · session ${session.id}` : ""}`.trim(),
          },
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
            content: `Meta Conversion Event payload calculated for Purchase value: €${parsedValue} EUR (${crmTag}).`,
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
          contentName: shopProduct?.name ?? productKey,
          contentType: "product",
          sourceUrl: `${siteUrl()}/shop/success?product=${encodeURIComponent(shopProduct?.slug ?? productKey)}`,
        });

        await logCaseTimeline(
          lead.id,
          "STAGE_CHANGED",
          `Payment complete — ${shopProduct?.name ?? funnelStageLabel(tier)} · ${crmTag}`,
          "System",
        );
        void sendNeuronourishPartnerAlert(updated);

        if (tier === "assessment_purchased") {
          void sendSlackAlert("ASSESSMENT_PAID", {
            name: `${updated.firstName} ${updated.lastName}`.trim(),
            email: updated.email,
            extra: `Cognitive assessment · CRM: ${siteUrl()}/workspace/cases/${updated.id}`,
          });
          await cancelSequenceTasksByPrefix(updated.id, "NN nurture [discovery_post_call]");
          await cancelSequenceTasksByPrefix(updated.id, "NN nurture [missed_discovery_call]");
          await cancelBloodSugarNewsletterSeries(updated.id);
          await cancelGutBrainNewsletterSeries(updated.id);
          void enrollNeuronourishNurture(updated, "assessment_complete");

          await ensureCnsSubjectId(updated);
          const cns = await issueCnsRemoteTest(updated.id);

          await db.note.create({
            data: {
              leadId: lead.id,
              author: "System",
              content: `[Credit] Assessment fee credited toward programme if enrolled within ${NN_PRICING.assessmentCreditDays} days. CNS status: ${cns.status}${cns.error ? ` · ${cns.error}` : ""}`,
            },
          });
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
