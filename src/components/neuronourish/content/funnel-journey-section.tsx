import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_FUNNEL_STAGES } from "@/lib/neuronourish-copy";

export function FunnelJourneySection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`border-y border-linen/80 bg-ivory py-14 sm:py-20 ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow={NN_FUNNEL_STAGES.eyebrow}
          headline={NN_FUNNEL_STAGES.headline}
          subtext={NN_FUNNEL_STAGES.subtext}
          align="center"
          headlineClassName="max-w-3xl"
        />

        <ol className="relative mx-auto mt-12 max-w-3xl">
          <div
            className="absolute bottom-6 left-[1.25rem] top-6 w-[3px] rounded-full bg-gradient-to-b from-gold via-[color-mix(in_oklab,var(--brand-deep-slate)_55%,var(--brand-plum))] to-mist"
            aria-hidden
          />
          {NN_FUNNEL_STAGES.stages.map((stage) => (
            <li key={stage.id} className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6">
              <span className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-white font-display text-xs text-deep-slate shadow-[0_6px_16px_rgba(27,58,92,0.12)]">
                {stage.id}
              </span>
              <div className="nn-card min-w-0 flex-1 rounded-2xl border border-mist/90 bg-white p-5 sm:p-6">
                <p className="nn-eyebrow text-gold">{stage.label}</p>
                <h3 className="nn-display-card mt-2 text-deep-slate">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{stage.body}</p>
                <Link
                  href={stage.href}
                  className="nn-text-link mt-4 inline-block text-sm font-medium"
                >
                  {stage.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </PageContainer>
    </PageSection>
  );
}
