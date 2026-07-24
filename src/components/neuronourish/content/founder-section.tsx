import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { FounderTrustStrip } from "@/components/neuronourish/content/founder-trust-strip";
import { NN_FOUNDER_ABOUT } from "@/lib/neuronourish-copy";

/** Homepage vision fold — light surface (no deep violet), third-person Emer blurb. */
export function FounderSection({ className = "" }: { className?: string }) {
  return (
    <PageSection
      id="vision"
      className={`nn-vision-section border-y border-linen/80 bg-linen/25 py-16 text-ink sm:py-20 lg:py-24 ${className}`}
    >
      <PageContainer width="lg">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>{NN_FOUNDER_ABOUT.eyebrow}</SectionEyebrow>
          <h2 className="nn-display-section mt-3 text-slate-blue">{NN_FOUNDER_ABOUT.headline}</h2>
          <p className="nn-body mx-auto mt-4 text-ink/80">{NN_FOUNDER_ABOUT.teaser}</p>
          {NN_FOUNDER_ABOUT.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="nn-body mx-auto mt-5 text-ink/75">
              {paragraph}
            </p>
          ))}
          <blockquote className="nn-pull-quote mx-auto mt-8 max-w-2xl text-slate-blue">
            {NN_FOUNDER_ABOUT.pullQuote}
          </blockquote>
          <CheckList items={NN_FOUNDER_ABOUT.highlights} className="mx-auto mt-8 max-w-xl text-left" />
        </div>

        <div className="mx-auto mt-14 max-w-3xl border-t border-mist/80 pt-10 text-center">
          <p className="nn-eyebrow text-gold">{NN_FOUNDER_ABOUT.builtByEyebrow}</p>
          <p className="nn-body mx-auto mt-4 text-ink/75">{NN_FOUNDER_ABOUT.builtBy}</p>
          <p className="nn-body mx-auto mt-4 text-ink/75">{NN_FOUNDER_ABOUT.builtByClose}</p>
          <p className="mt-6 text-sm font-medium text-deep-slate">
            {NN_FOUNDER_ABOUT.attribution.replace(/^—\s*/, "")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-blue">
            {NN_FOUNDER_ABOUT.credentialsShort}
          </p>
          <div className="mt-8 flex flex-col items-center gap-1.5">
            <GoldButton href="/about">{NN_FOUNDER_ABOUT.cta}</GoldButton>
          </div>
        </div>

        <FounderTrustStrip tone="light" />
      </PageContainer>
    </PageSection>
  );
}
