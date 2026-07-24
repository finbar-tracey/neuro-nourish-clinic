import { GoldButton } from "@/components/neuronourish/shell";
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
        <div className="mt-10 flex flex-col items-center gap-1.5 border-t border-mist/80 pt-10">
          <GoldButton href="/programme">{NN_WHY.cta}</GoldButton>
          <span className="text-center text-xs text-ink/60">{NN_WHY.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
