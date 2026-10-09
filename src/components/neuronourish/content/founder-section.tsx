import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { FounderTrustStrip } from "@/components/neuronourish/content/founder-trust-strip";
import { FounderPortrait } from "@/components/neuronourish/content/visual-placeholders";
import { NN_FOUNDER_ABOUT } from "@/lib/neuronourish-copy";

/** Homepage vision fold — light surface (no deep violet), third-person Emer blurb + portrait. */
export function FounderSection({ className = "" }: { className?: string }) {
  return (
    <PageSection
      id="vision"
      className={`nn-vision-section border-y border-linen/80 bg-linen/25 py-16 text-ink sm:py-20 lg:py-24 ${className}`}
    >
      <PageContainer width="lg">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>{NN_FOUNDER_ABOUT.eyebrow}</SectionEyebrow>
          <h2 className="nn-display-section mt-3 text-deep-slate">{NN_FOUNDER_ABOUT.headline}</h2>
          <p className="nn-body mx-auto mt-4 text-ink/80">{NN_FOUNDER_ABOUT.teaser}</p>
          {NN_FOUNDER_ABOUT.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="nn-body mx-auto mt-5 text-ink/75">
              {paragraph}
            </p>
          ))}
          <blockquote className="nn-pull-quote mx-auto mt-8 max-w-2xl text-deep-slate">
            {NN_FOUNDER_ABOUT.pullQuote}
          </blockquote>
          <CheckList items={NN_FOUNDER_ABOUT.highlights} className="mx-auto mt-8 max-w-xl text-left" />
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl items-center gap-10 border-t border-mist/80 pt-10 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-12 lg:text-left">
          <FounderPortrait rectangular src="/brand/emer-built-by-portrait.jpg" className="mx-auto lg:mx-0" />
          <div className="text-center lg:text-left">
            <p className="nn-eyebrow text-gold">{NN_FOUNDER_ABOUT.builtByEyebrow}</p>
            <p className="nn-body mt-4 text-ink/75">{NN_FOUNDER_ABOUT.builtBy}</p>
            <p className="nn-body mt-4 text-ink/75">{NN_FOUNDER_ABOUT.builtByClose}</p>
            <p className="mt-6 text-sm font-medium text-deep-slate">
              {NN_FOUNDER_ABOUT.attribution.replace(/^—\s*/, "")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-blue">
              {NN_FOUNDER_ABOUT.credentialsShort}
            </p>
            <div className="mt-8 flex flex-col items-center gap-1.5 lg:items-start">
              <GoldButton href="/about">{NN_FOUNDER_ABOUT.cta}</GoldButton>
            </div>
          </div>
        </div>

        <FounderTrustStrip tone="light" />
      </PageContainer>
    </PageSection>
  );
}
