import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { NN_PRICING } from "@/lib/neuronourish-funnel";
import { NN_STRIPE_PROGRAMME } from "@/lib/neuronourish-copy";
import { siteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";
import { enrollNeuronourishNurture } from "@/lib/neuronourish-nurture";

type Product = "assessment" | "programme";

const PRODUCTS: Record<
  Product,
  {
    name: string;
    description?: string;
    receiptFooter?: string;
    amount: number;
    currency: string;
    successPath: string;
    stage: string;
  }
> = {
  assessment: {
    name: "NeuroNourish Cognitive Health Assessment",
    amount: NN_PRICING.assessmentCents,
    currency: NN_PRICING.assessmentCurrency,
    successPath: "/assessment/success",
    stage: "assessment_purchased",
  },
  programme: {
    name: "NeuroNourish 12-Month Personalised Brain Health Programme",
    description: NN_STRIPE_PROGRAMME.checkoutDescription,
    receiptFooter: NN_STRIPE_PROGRAMME.receiptFooter,
    amount: NN_PRICING.programmeCents,
    currency: NN_PRICING.programmeCurrency,
    successPath: "/programme/success",
    stage: "programme_enrolled",
  },
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const product = body.product as Product;
  const leadId = body.leadId as string | undefined;

  if (!product || !PRODUCTS[product]) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const stripeKey = runtimeSecret("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return NextResponse.json(
      {
        error:
          "Online checkout is being configured. Please book a discovery call or contact our team.",
        fallbackUrl: `${siteUrl()}/discovery`,
      },
      { status: 503 },
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);
  const cfg = PRODUCTS[product];
  const base = siteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: cfg.currency,
          unit_amount: cfg.amount,
          product_data: {
            name: cfg.name,
            ...(cfg.description ? { description: cfg.description } : {}),
          },
        },
        quantity: 1,
      },
    ],
    ...(cfg.receiptFooter
      ? {
          custom_text: {
            submit: { message: cfg.receiptFooter },
          },
          payment_intent_data: {
            description: cfg.description,
          },
        }
      : {}),
    success_url: `${base}${cfg.successPath}?session_id={CHECKOUT_SESSION_ID}&leadId=${leadId ?? ""}`,
    cancel_url: `${base}/${product === "assessment" ? "assessment" : "programme"}?leadId=${leadId ?? ""}`,
    metadata: {
      product,
      leadId: leadId ?? "",
      funnelStage: cfg.stage,
    },
  });

  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      await db.lead.update({
        where: { id: leadId },
        data: {
          funnelStage: product === "assessment" ? "assessment_offered" : "programme_offered",
          pipelineValueEur: product === "assessment" ? 90 : 3550,
        },
      });
      await logCaseTimeline(lead.id, "FORM_SUBMITTED", `Checkout started: ${cfg.name}`, "Borrower");
      if (product === "assessment") {
        void enrollNeuronourishNurture(lead, "assessment_abandon");
      }
    }
  }

  return NextResponse.json({ url: session.url });
}
