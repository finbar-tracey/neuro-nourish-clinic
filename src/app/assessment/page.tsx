"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { FunnelStepper } from "@/components/neuronourish/content/funnel-stepper";
import { FunnelTrustBar } from "@/components/neuronourish/content/funnel-trust-bar";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_ASSESSMENT } from "@/lib/neuronourish-copy";
import { NN_PRICING } from "@/lib/neuronourish-funnel";
import { fireMetaInitiateCheckoutEvent } from "@/lib/meta-tracking";

function AssessmentContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    if (leadId) {
      fireMetaInitiateCheckoutEvent(
        "assessment",
        NN_PRICING.assessmentCents / 100,
        leadId,
      );
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: "assessment", leadId }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    setError(json.error ?? "Checkout unavailable. Please book a discovery call.");
  }

  return (
    <NeuroNourishShell>
      <PageSection className="nn-assessment-section">
        <PageContainer width="md">
          <FunnelStepper active="assessment" />
          <div className="mt-8">
            <SectionHeader
              eyebrow={NN_ASSESSMENT.eyebrow}
              headline={NN_ASSESSMENT.headline}
              subtext={NN_ASSESSMENT.subtext}
              align="center"
              headlineClassName="mx-auto max-w-2xl"
            />
          </div>

          <FunnelTrustBar className="mt-6" />

          <div className="nn-funnel-card relative mx-auto mt-10 max-w-lg overflow-hidden rounded-2xl border border-mist bg-white/90 p-8 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/60" aria-hidden />
            {NN_ASSESSMENT.showPublicPrice ? (
              <>
                <p className="text-center font-display text-4xl text-gold">{NN_ASSESSMENT.price}</p>
                <p className="mt-2 text-center text-sm text-ink/65">{NN_ASSESSMENT.creditNote}</p>
              </>
            ) : (
              <>
                <p className="text-center font-display text-2xl text-slate-blue sm:text-3xl">
                  {NN_ASSESSMENT.investmentHeadline}
                </p>
                <p className="mt-3 text-center text-sm leading-relaxed text-ink/75">
                  {NN_ASSESSMENT.investmentBody}
                </p>
              </>
            )}
            <p className="mt-8 text-sm font-medium text-slate-blue">{NN_ASSESSMENT.includesLabel}</p>
            <CheckList items={NN_ASSESSMENT.includes} className="mt-4" />
          </div>

          <p className="mx-auto mt-6 max-w-lg rounded-xl border border-mist/80 bg-linen/20 px-4 py-3 text-center text-xs leading-relaxed text-ink/65">
            {NN_ASSESSMENT.disclaimer}
          </p>

          {error ? (
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-red-700">{error}</p>
          ) : null}

          <div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={checkout}
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90 disabled:opacity-50 sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : NN_ASSESSMENT.cta}
            </button>
            <span className="text-xs text-ink/60">{NN_ASSESSMENT.ctaHint}</span>
            <Link href="/discovery" className="nn-text-link mt-3 text-sm">
              {NN_ASSESSMENT.ctaDiscovery} →
            </Link>
          </div>

          <p className="mx-auto mt-6 max-w-lg rounded-xl border border-mist/80 bg-linen/20 px-4 py-3 text-xs leading-relaxed text-ink/65">
            <span className="font-medium text-slate-blue">{NN_ASSESSMENT.expiryPolicyLabel}</span>{" "}
            {NN_ASSESSMENT.expiryPolicy}
          </p>

          <p className="mt-8 text-center text-sm text-ink/70">
            Questions first?{" "}
            <Link href="/contact" className="nn-text-link">
              Contact our team
            </Link>
          </p>

          {leadId ? (
            <p className="mt-4 text-center text-sm text-ink/60">
              <Link href={`/quiz/results?leadId=${leadId}`} className="nn-text-link">
                ← Back to your quiz results
              </Link>
            </p>
          ) : null}
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense>
      <AssessmentContent />
    </Suspense>
  );
}
