import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { WhyBenefitsGrid } from "@/components/neuronourish/content/why-benefits-grid";
import { NN_WHY } from "@/lib/neuronourish-copy";

export function WhySection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="why" className={`nn-why-section border-y border-linen ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow="Why NeuroNourish"
          headline={NN_WHY.headline}
          subtext={NN_WHY.subtext}
        />
        <WhyBenefitsGrid />
      </PageContainer>
    </PageSection>
  );
}
