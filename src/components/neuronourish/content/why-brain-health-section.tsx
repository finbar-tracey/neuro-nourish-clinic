import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_WHY_BRAIN_HEALTH } from "@/lib/neuronourish-copy";

export function WhyBrainHealthSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`border-t border-linen/80 bg-ivory py-14 sm:py-20 ${className}`}>
      <PageContainer width="lg">
        <SectionHeader
          eyebrow={NN_WHY_BRAIN_HEALTH.eyebrow}
          headline={NN_WHY_BRAIN_HEALTH.headline}
          subtext={NN_WHY_BRAIN_HEALTH.body}
          align="center"
          headlineClassName="max-w-3xl"
        />

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {NN_WHY_BRAIN_HEALTH.factors.map((factor) => (
            <li
              key={factor}
              className="rounded-full border border-mist/80 bg-white px-3.5 py-1.5 text-sm text-ink/75 shadow-sm"
            >
              {factor}
            </li>
          ))}
        </ul>

        <p className="nn-body mx-auto mt-8 max-w-2xl text-center text-ink/80">
          {NN_WHY_BRAIN_HEALTH.close}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-ink/50">
          Source: {NN_WHY_BRAIN_HEALTH.citation}
        </p>

        <div className="mt-8 flex justify-center">
          <GoldButton href={NN_WHY_BRAIN_HEALTH.ctaHref}>{NN_WHY_BRAIN_HEALTH.cta}</GoldButton>
        </div>
      </PageContainer>
    </PageSection>
  );
}
