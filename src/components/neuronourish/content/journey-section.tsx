import { GoldButton } from "@/components/neuronourish/shell";
import { AppPreviewVisual } from "@/components/neuronourish/content/app-preview-visual";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_APP, NN_JOURNEY } from "@/lib/neuronourish-copy";

/** Homepage journey — Emer 3-step Method (detail stays on /programme). */
export function JourneySection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="journey" className={`nn-journey-section ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow={NN_JOURNEY.eyebrow}
          headline={NN_JOURNEY.headline}
          subtext={NN_JOURNEY.subtext}
        />

        <NnCardGrid as="ol" className="mt-8 lg:mt-10">
          {NN_JOURNEY.method.map((phase) => (
            <NnCard key={phase.title} as="li">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-ivory font-display text-sm text-deep-slate">
                  {phase.step}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="nn-display-card text-deep-slate">{phase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{phase.body}</p>
                </div>
              </div>
            </NnCard>
          ))}
        </NnCardGrid>

        <div className="mt-12 grid items-center gap-10 rounded-3xl border border-mist/80 bg-white px-5 py-8 shadow-[0_12px_32px_rgba(27,58,92,0.08)] sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="max-w-lg">
            <p className="nn-eyebrow text-gold">Ongoing support</p>
            <h3 className="nn-display-card mt-3 text-deep-slate">
              Daily tracking inside the NeuroNourish App
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Through ongoing coaching, app tracking and regular reviews, we help you build habits
              that support lifelong cognitive health. App access is included for programme clients.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink/55">{NN_APP.ctaHint}</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <AppPreviewVisual />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1.5 border-t border-mist/80 pt-10">
          <GoldButton href="/programme">{NN_JOURNEY.cta}</GoldButton>
          <span className="text-center text-xs text-ink/60">{NN_JOURNEY.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
