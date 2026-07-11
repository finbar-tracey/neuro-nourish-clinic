"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { FunnelStepper } from "@/components/neuronourish/content/funnel-stepper";
import { FunnelTrustBar } from "@/components/neuronourish/content/funnel-trust-bar";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NeuroNourishShell, GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_FOOTER, NN_PROGRAMME, NN_PROGRAMME_CHECKOUT } from "@/lib/neuronourish-copy";
import { NN_PRICING } from "@/lib/neuronourish-funnel";
import { fireMetaInitiateCheckoutEvent } from "@/lib/meta-tracking";

type ProgrammeContentProps = {
  checkoutAvailable: boolean;
};

export function ProgrammeContent({ checkoutAvailable }: ProgrammeContentProps) {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const discoveryHref = leadId
    ? `/discovery?leadId=${encodeURIComponent(leadId)}`
    : "/discovery";
  const assessmentHref = leadId
    ? `/assessment?leadId=${encodeURIComponent(leadId)}`
    : "/assessment";
  const quizResultsHref = leadId
    ? `/quiz/results?leadId=${encodeURIComponent(leadId)}`
    : null;

  async function checkout() {
    setLoading(true);
    setError("");
    if (leadId) {
      fireMetaInitiateCheckoutEvent(
        "programme",
        NN_PRICING.programmeCents / 100,
        leadId,
      );
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: "programme", leadId }),
    });
    const json = (await res.json()) as { url?: string; error?: string; fallbackUrl?: string };
    setLoading(false);
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    setError(
      json.error ??
        "Checkout unavailable. Please book a discovery call or contact our team.",
    );
  }

  return (
    <NeuroNourishShell>
      <PageSection className="nn-programme-section py-14 sm:py-20">
        <PageContainer width="md">
          <FunnelStepper active="programme" />

          <header className="mt-10 text-center">
            <p className="font-display text-2xl tracking-tight text-deep-slate sm:text-3xl">
              {NN_PROGRAMME.brand}
            </p>
            <div className="mt-5">
              <SectionEyebrow>{NN_PROGRAMME.eyebrow}</SectionEyebrow>
            </div>
            <h1 className="nn-display-section mx-auto mt-3 max-w-2xl text-slate-blue">
              {NN_PROGRAMME.headline}
            </h1>
            <p className="nn-body mx-auto mt-4 max-w-xl text-ink/85">{NN_PROGRAMME.subtext}</p>
            <FunnelTrustBar className="mt-6" />
          </header>

          <div className="mx-auto mt-10 max-w-lg border-y border-linen/80 py-8 text-center">
            {NN_PROGRAMME.showPublicPrice ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-blue">
                  {NN_PROGRAMME.priceLabel}
                </p>
                <p className="mt-2 font-display text-5xl text-gold">{NN_PROGRAMME.price}</p>
                <p className="mt-2 text-sm text-ink/65">{NN_PROGRAMME.billingNote}</p>
                <p className="mt-4 text-sm text-slate-blue">{NN_PROGRAMME.creditNote}</p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl text-slate-blue sm:text-3xl">
                  {NN_PROGRAMME.investmentHeadline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {NN_PROGRAMME.investmentBody}
                </p>
                <p className="mt-4 text-sm text-slate-blue">{NN_PROGRAMME.billingNote}</p>
              </>
            )}
          </div>

          <CheckList
            items={NN_PROGRAMME.highlights}
            className="mx-auto mt-8 max-w-md"
          />

          <section className="mt-14" aria-labelledby="programme-inclusions">
            <h2
              id="programme-inclusions"
              className="text-center font-display text-xl text-slate-blue sm:text-2xl"
            >
              {NN_PROGRAMME.inclusionsTitle}
            </h2>
            <ul className="mx-auto mt-8 max-w-xl space-y-5">
              {NN_PROGRAMME.inclusions.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-medium text-deep-slate">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink/70">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 border-t border-linen/70 pt-12" aria-labelledby="programme-year">
            <h2
              id="programme-year"
              className="text-center font-display text-xl text-slate-blue sm:text-2xl"
            >
              {NN_PROGRAMME.yearTitle}
            </h2>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
              {NN_PROGRAMME.yearPhases.map((phase) => (
                <li key={phase.timing} className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {phase.timing}
                  </p>
                  <p className="mt-2 text-sm font-medium text-deep-slate">{phase.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">{phase.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-slate-blue">{NN_PROGRAMME.capacityTitle}. </span>
            {NN_PROGRAMME.capacityText}
          </p>

          <section className="mt-14 border-t border-linen/70 pt-12" aria-labelledby="programme-cta">
            <h2 id="programme-cta" className="sr-only">
              Enrol or book a call
            </h2>

            {!checkoutAvailable ? (
              <div className="mx-auto max-w-lg text-center">
                <p className="font-display text-xl text-slate-blue">
                  {NN_PROGRAMME.checkoutUnavailableTitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {NN_PROGRAMME.checkoutUnavailableBody}
                </p>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <GoldButton href={discoveryHref} className="w-full min-h-[48px] sm:w-auto">
                    {NN_PROGRAMME.ctaDiscovery}
                  </GoldButton>
                  <span className="text-xs text-ink/55">{NN_PROGRAMME.ctaDiscoveryHint}</span>
                  <a href={`mailto:${NN_FOOTER.email}`} className="nn-text-link mt-2 text-sm">
                    {NN_PROGRAMME.ctaContact}
                  </a>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-lg flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={checkout}
                  disabled={loading}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90 disabled:opacity-50 sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    NN_PROGRAMME_CHECKOUT.cta
                  )}
                </button>
                <span className="text-xs text-ink/60">{NN_PROGRAMME.ctaHint}</span>
                <Link href={discoveryHref} className="nn-text-link mt-3 text-sm">
                  {NN_PROGRAMME.ctaDiscovery} →
                </Link>
              </div>
            )}

            {error ? (
              <p className="mx-auto mt-4 max-w-lg text-center text-sm text-red-700" role="alert">
                {error}{" "}
                <Link href={discoveryHref} className="nn-text-link">
                  Book a discovery call →
                </Link>
              </p>
            ) : null}
          </section>

          <section className="mt-14 border-t border-linen/70 pt-12" aria-labelledby="programme-faq">
            <h2
              id="programme-faq"
              className="text-center font-display text-xl text-slate-blue sm:text-2xl"
            >
              {NN_PROGRAMME.faqTitle}
            </h2>
            <dl className="mx-auto mt-8 max-w-xl space-y-5">
              {NN_PROGRAMME.faq.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-medium text-deep-slate">{item.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink/70">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-12 space-y-3 text-center text-sm text-ink/70">
            <p>
              Prefer to start smaller?{" "}
              <Link href={assessmentHref} className="nn-text-link">
                Cognitive health assessment
              </Link>
            </p>
            {quizResultsHref ? (
              <p>
                <Link href={quizResultsHref} className="nn-text-link">
                  ← Back to your quiz results
                </Link>
              </p>
            ) : null}
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
