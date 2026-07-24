import Image from "next/image";
import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
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

        <NnCardGrid className="mt-10">
          {NN_OUTCOMES.stats.map((stat) => (
            <NnCard key={stat.label} align="center">
              <p className="font-display text-4xl text-slate-blue lg:text-[2.75rem]">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{stat.label}</p>
            </NnCard>
          ))}
        </NnCardGrid>

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {NN_OUTCOMES.outcomes.map((outcome) => (
            <li
              key={outcome}
              className="flex w-[calc(50%-0.35rem)] max-w-[11.5rem] items-center justify-center gap-2 rounded-full border border-mist/80 bg-white/60 px-3 py-2 text-center text-sm text-ink/80 sm:w-auto sm:min-w-[11.5rem]"
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

        <div className="mx-auto mt-12 max-w-4xl border-t border-mist/80 pt-10 text-center">
          <p className="nn-eyebrow text-slate-blue">{NN_OUTCOMES.clinicalPartnersEyebrow}</p>
          <ul className="mt-6 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
            {NN_OUTCOMES.clinicalPartners.map((partner) => (
              <li
                key={partner.name}
                className="flex min-h-[5rem] w-[calc(50%-0.4rem)] max-w-[12rem] items-center justify-center rounded-xl border border-mist/80 bg-white px-4 py-3 sm:w-[calc(33.333%-0.7rem)] lg:w-[calc(25%-0.75rem)]"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  className="h-10 w-auto max-w-[9.5rem] object-contain"
                />
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="nn-pull-quote mx-auto mt-10 max-w-2xl text-slate-blue">
          {NN_OUTCOMES.testimonial.quote}
          <footer className="mt-3 font-sans text-sm font-normal text-ink/65">
            — {NN_OUTCOMES.testimonial.attribution}
          </footer>
        </blockquote>

        <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-mist/80 bg-linen/25 px-4 py-3 text-center text-xs leading-relaxed text-ink/65">
          {NN_OUTCOMES.disclaimer}
        </p>

        <div className="mt-8 flex flex-col items-center gap-1.5">
          <GoldButton href={NN_OUTCOMES.ctaHref}>{NN_OUTCOMES.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_OUTCOMES.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
