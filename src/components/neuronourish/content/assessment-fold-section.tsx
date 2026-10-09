import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_ASSESSMENT_FOLD } from "@/lib/neuronourish-copy";

export function AssessmentFoldSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`nn-journey-section py-14 sm:py-20 ${className}`}>
      <PageContainer width="md" className="text-center">
        <SectionHeader
          eyebrow={NN_ASSESSMENT_FOLD.eyebrow}
          headline={NN_ASSESSMENT_FOLD.headline}
          subtext={NN_ASSESSMENT_FOLD.subtext}
          align="center"
          headlineClassName="max-w-2xl"
        />
        <p className="mt-6 font-display text-4xl text-deep-slate">{NN_ASSESSMENT_FOLD.price}</p>
        <div className="mt-8 flex flex-col items-center gap-1.5">
          <GoldButton href={NN_ASSESSMENT_FOLD.ctaHref}>{NN_ASSESSMENT_FOLD.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_ASSESSMENT_FOLD.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
