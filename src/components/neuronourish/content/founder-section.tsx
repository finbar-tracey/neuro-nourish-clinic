import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { FounderPortrait } from "@/components/neuronourish/content/visual-placeholders";
import { FounderTrustStrip } from "@/components/neuronourish/content/founder-trust-strip";
import { NN_FOUNDER_ABOUT } from "@/lib/neuronourish-copy";

export function FounderSection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="founder" className={`nn-founder-section bg-deep-violet py-20 text-ivory sm:py-24 lg:py-28 ${className}`}>
      <PageContainer width="xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-center lg:gap-16 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] xl:gap-20">
          <FounderPortrait variant="dark" priority className="lg:sticky lg:top-24" />
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-none lg:border-l lg:border-gold/30 lg:pl-12">
            <div className="text-center lg:text-left">
              <SectionEyebrow>{NN_FOUNDER_ABOUT.eyebrow}</SectionEyebrow>
              <h2 className="nn-display-section mt-3 text-ivory">{NN_FOUNDER_ABOUT.headline}</h2>
              <p className="nn-body mt-5 text-sky-blue">{NN_FOUNDER_ABOUT.teaser}</p>
            </div>

            <blockquote className="nn-pull-quote nn-pull-quote-dark mx-auto mt-6 max-w-lg text-mist lg:mx-0">
              {NN_FOUNDER_ABOUT.pullQuote}
            </blockquote>

            <CheckList items={NN_FOUNDER_ABOUT.highlights} tone="dark" className="mt-6" />

            <div className="mt-8 border-t border-ivory/15 pt-6 text-center lg:text-left">
              <p className="font-medium text-ivory">{NN_FOUNDER_ABOUT.attribution}</p>
              <p className="mt-1 text-sm leading-relaxed text-lavender">
                {NN_FOUNDER_ABOUT.credentialsShort}
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-1.5 lg:items-start">
              <GoldButton href="/about">{NN_FOUNDER_ABOUT.cta}</GoldButton>
            </div>
          </div>
        </div>
        <FounderTrustStrip />
      </PageContainer>
    </PageSection>
  );
}
