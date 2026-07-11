import { Suspense } from "react";
import { DiscoveryBookingPanel } from "@/components/neuronourish/discovery-booking-panel";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("discovery");

export default function DiscoveryPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <NeuroNourishShell>
      <PageSection className="nn-discovery-section py-14 sm:py-20">
        <PageContainer width="md">
          <Suspense
            fallback={
              <p className="text-center text-sm text-ink/60">Loading discovery booking…</p>
            }
          >
            <DiscoveryBookingPanel calendlyUrl={calendlyUrl} />
          </Suspense>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
