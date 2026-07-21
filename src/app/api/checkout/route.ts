import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import { getShopProduct } from "@/lib/neuronourish-shop";
import { resolveShopCheckoutLead } from "@/lib/shop-checkout-lead";
import { siteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";
import { enrollNeuronourishNurture } from "@/lib/neuronourish-nurture";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    product?: string;
    leadId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
  };

  const productKey = typeof body.product === "string" ? body.product : "";
  const product = getShopProduct(productKey);
  if (!product || product.ctaType !== "buy") {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const requireDob = product.funnelStage === "assessment_purchased";
  let leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  let customerEmail =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().toLowerCase()
      : undefined;

  if (requireDob) {
    const resolved = await resolveShopCheckoutLead({
      leadId: leadId || undefined,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      requireDob: true,
    });
    if (resolved.error || !resolved.lead) {
      return NextResponse.json(
        { error: resolved.error ?? "Checkout details invalid" },
        { status: 400 },
      );
    }
    leadId = resolved.lead.id;
    customerEmail = resolved.lead.email;
  } else if (leadId || (body.email && body.firstName && body.lastName)) {
    const resolved = await resolveShopCheckoutLead({
      leadId: leadId || undefined,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      requireDob: false,
    });
    if (resolved.error) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    if (resolved.lead) {
      leadId = resolved.lead.id;
      customerEmail = resolved.lead.email;
    }
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
  const base = siteUrl();
  const successPath = `/shop/success?product=${encodeURIComponent(product.slug)}&session_id={CHECKOUT_SESSION_ID}&leadId=${encodeURIComponent(leadId)}`;
  const cancelQs = leadId ? `?leadId=${encodeURIComponent(leadId)}` : "";
  const cancelPath = `${base}/shop/${product.slug}${cancelQs}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    line_items: [
      {
        price_data: {
          currency: product.currency,
          unit_amount: product.amountCents,
          product_data: {
            name: `NeuroNourish ${product.name}`,
            description: product.subtext.slice(0, 500),
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${base}${successPath}`,
    cancel_url: cancelPath,
    metadata: {
      product: product.slug,
      legacyProduct: productKey,
      leadId,
      funnelStage: product.funnelStage,
      crmTag: product.crmTag,
    },
  });

  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      const offeredStage =
        product.funnelStage === "assessment_purchased"
          ? "assessment_offered"
          : product.funnelStage === "programme_enrolled"
            ? "programme_offered"
            : lead.funnelStage;
      await db.lead.update({
        where: { id: leadId },
        data: {
          funnelStage: offeredStage,
          pipelineValueEur: Math.round(product.amountCents / 100),
          additionalInfo: `${lead.additionalInfo ?? ""}\n[Shop] Checkout started · ${product.crmTag} · ${product.slug}`.trim(),
        },
      });
      await logCaseTimeline(lead.id, "FORM_SUBMITTED", `Checkout started: ${product.name}`, "System");
      if (product.funnelStage === "assessment_purchased") {
        void enrollNeuronourishNurture(lead, "assessment_abandon");
      }
    }
  }

  return NextResponse.json({ url: session.url, leadId: leadId || undefined });
}
