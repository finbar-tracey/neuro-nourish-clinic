import { Suspense } from "react";
import { DiscoveryBookingPanel } from "@/components/neuronourish/discovery-booking-panel";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { FunnelTrustBar } from "@/components/neuronourish/content/funnel-trust-bar";
import { NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_DISCOVERY } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("discovery");

export default function DiscoveryPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <NeuroNourishShell>
      <PageSection className="nn-discovery-section py-14 sm:py-20">
        <PageContainer width="md">
          <header className="mx-auto max-w-2xl text-center">
            <p className="nn-display-section tracking-tight text-slate-blue">{NN_DISCOVERY.brand}</p>
            <div className="mt-5">
              <SectionEyebrow>{NN_DISCOVERY.eyebrow}</SectionEyebrow>
            </div>
            <h1 className="nn-display-section mx-auto mt-3 max-w-2xl text-slate-blue">
              {NN_DISCOVERY.headline}
            </h1>
            <p className="nn-body mx-auto mt-4 max-w-xl text-ink/85">{NN_DISCOVERY.subtext}</p>
            <CheckList items={NN_DISCOVERY.highlights} className="mx-auto mt-8 max-w-md text-left" />
            <FunnelTrustBar className="mt-6" />
          </header>

          <Suspense
            fallback={
              <p className="mt-12 text-center text-sm text-ink/60">Loading discovery booking…</p>
            }
          >
            <DiscoveryBookingPanel calendlyUrl={calendlyUrl} hideIntro />
          </Suspense>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
