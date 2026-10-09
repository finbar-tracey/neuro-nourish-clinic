import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { LogoMarquee } from "@/components/neuronourish/content/logo-marquee";
import { NN_OUTCOMES } from "@/lib/neuronourish-copy";

export function OutcomesSection({ className = "" }: { className?: string }) {
  return (
    <PageSection
      id="outcomes"
      className={`nn-defer-section nn-outcomes-section border-y border-linen lg:py-24 ${className}`}
    >
      <PageContainer width="xl">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>{NN_OUTCOMES.eyebrow}</SectionEyebrow>
          <h2 className="nn-display-section mt-3 text-deep-slate">{NN_OUTCOMES.headline}</h2>
          <p className="nn-body mx-auto mt-4 text-ink/75">{NN_OUTCOMES.subtext}</p>
        </div>

        {/* Outcome stats hidden until source audit (handover §22). */}
        {!NN_OUTCOMES.statsPendingAudit ? (
          <div className="nn-outcomes-stats-panel mt-10 rounded-3xl px-5 py-8 sm:px-8 sm:py-10">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {NN_OUTCOMES.stats.map((stat) => (
                <li key={stat.label} className="text-center">
                  <p className="font-display text-4xl text-ivory lg:text-[2.75rem]">{stat.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mist/90">{stat.label}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {NN_OUTCOMES.outcomes.map((outcome) => (
            <li
              key={outcome}
              className="flex w-[calc(50%-0.35rem)] max-w-[11.5rem] items-center justify-center gap-2 rounded-full border border-mist/80 bg-white px-3 py-2 text-center text-sm text-ink/80 shadow-sm sm:w-auto sm:min-w-[11.5rem]"
            >
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-medium text-gold"
                aria-hidden
              >
                ✓
              </span>
              <span className="leading-snug">{outcome}</span>
            </li>
          ))}
        </ul>
      </PageContainer>

      <div className="mt-12 -mx-4 sm:-mx-6">
        <LogoMarquee
          eyebrow={NN_OUTCOMES.clinicalPartnersEyebrow}
          items={NN_OUTCOMES.clinicalPartners.map((partner) => ({
            name: partner.name,
            logo: partner.logo,
            width: partner.width,
            height: partner.height,
          }))}
        />
      </div>

      <PageContainer width="xl" className="mt-10">
        <figure className="mx-auto max-w-2xl rounded-3xl border border-mist/90 bg-white px-6 py-9 shadow-[0_14px_36px_rgba(27,58,92,0.1)] sm:px-10 sm:py-10">
          <blockquote className="nn-pull-quote text-deep-slate">
            {NN_OUTCOMES.testimonial.quote}
          </blockquote>
          <figcaption className="mt-5 text-sm font-medium text-deep-slate/80">
            — {NN_OUTCOMES.testimonial.attribution}
          </figcaption>
          <p className="mt-6 border-t border-mist/70 pt-5 text-xs leading-relaxed text-ink/55">
            {NN_OUTCOMES.disclaimer}
          </p>
        </figure>

        <div className="mt-8 flex flex-col items-center gap-1.5">
          <GoldButton href={NN_OUTCOMES.ctaHref}>{NN_OUTCOMES.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_OUTCOMES.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
