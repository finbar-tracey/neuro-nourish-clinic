import { GoldButton, OutlineButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NN_HERO } from "@/lib/neuronourish-copy";

export function HeroSection() {
  return (
    <PageSection className="nn-hero relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <div className="nn-hero-glow" aria-hidden />
      <PageContainer width="md" className="relative z-[1] text-center">
        <div className="nn-hero-enter">
          <p className="nn-hero-brand font-display text-2xl tracking-tight text-ivory sm:text-3xl">
            {NN_HERO.brand}
          </p>

          <h1 className="nn-display-hero mx-auto mt-5 max-w-[22ch] whitespace-pre-line text-balance text-ivory sm:max-w-[28ch]">
            {NN_HERO.headline}
          </h1>

          <p className="nn-hero-lead mx-auto mt-5 text-sky-blue">{NN_HERO.subtext}</p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <GoldButton href="/quiz">{NN_HERO.ctaQuiz}</GoldButton>
            <span className="text-center text-xs text-sky-blue/85">{NN_HERO.ctaQuizHint}</span>
            <OutlineButton
              href={NN_HERO.ctaAssessmentHref}
              className="mt-2 border-ivory/30 text-ivory hover:bg-white/10"
            >
              {NN_HERO.ctaAssessment}
            </OutlineButton>
          </div>
        </div>
      </PageContainer>
    </PageSection>
  );
}
