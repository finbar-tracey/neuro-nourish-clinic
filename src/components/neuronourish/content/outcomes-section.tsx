import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
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
          <h2 className="nn-display-section mt-3 text-slate-blue">{NN_OUTCOMES.headline}</h2>
          <p className="nn-body mx-auto mt-4 text-ink/75">{NN_OUTCOMES.subtext}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:gap-5">
          {NN_OUTCOMES.stats.map((stat) => (
            <div
              key={stat.label}
              className="nn-outcomes-stat relative overflow-hidden rounded-2xl border border-mist bg-linen/30 px-5 py-6 text-center"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/60" aria-hidden />
              <p className="font-display text-4xl text-slate-blue lg:text-[2.75rem]">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{stat.label}</p>
            </div>
          ))}
        </div>

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {NN_OUTCOMES.outcomes.map((outcome) => (
            <li
              key={outcome}
              className="flex min-w-[10.5rem] items-center justify-center gap-2 rounded-full border border-mist/80 bg-white/60 px-3 py-2 text-sm text-ink/80 sm:min-w-[11.5rem]"
            >
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-medium text-gold"
                aria-hidden
              >
                ✓
              </span>
              <span className="whitespace-nowrap leading-snug">{outcome}</span>
            </li>
          ))}
        </ul>

        <blockquote className="nn-pull-quote mx-auto mt-10 max-w-2xl text-slate-blue">
          {NN_OUTCOMES.testimonial.quote}
          <footer className="mt-3 font-sans text-sm font-normal text-ink/65">
            — {NN_OUTCOMES.testimonial.attribution}
          </footer>
        </blockquote>

        <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-mist/80 bg-white/50 px-4 py-3 text-center text-xs leading-relaxed text-ink/65">
          {NN_OUTCOMES.disclaimer}
        </p>

        <div className="mt-8 flex flex-col items-center gap-1.5">
          <GoldButton href="/discovery">{NN_OUTCOMES.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_OUTCOMES.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
