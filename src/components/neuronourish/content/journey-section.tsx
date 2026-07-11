import { GoldButton } from "@/components/neuronourish/shell";
import { AppPreviewVisual } from "@/components/neuronourish/content/app-preview-visual";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { JourneyTimeline } from "@/components/neuronourish/content/journey-timeline";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_APP, NN_JOURNEY } from "@/lib/neuronourish-copy";

export function JourneySection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="journey" className={`nn-journey-section ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow="Your journey"
          headline={NN_JOURNEY.headline}
          subtext={NN_JOURNEY.subtext}
        />
        <JourneyTimeline />

        <div className="mt-12 grid items-center gap-8 border-t border-mist/80 pt-12 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-lg">
            <p className="nn-eyebrow text-gold">Ongoing support</p>
            <h3 className="nn-display-card mt-3 text-slate-blue">
              Daily tracking inside the NeuroNourish App
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Your progress doesn&apos;t happen in sessions alone. Through regular check-ins,
              personalised guidance, and daily tracking inside the NeuroNourish App, you receive
              ongoing support, accountability, and real-time insight into your cognitive,
              nutritional, and lifestyle progress.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink/55">{NN_APP.ctaHint}</p>
          </div>
          <AppPreviewVisual />
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-mist/80 pt-10">
          <GoldButton href="/programme">{NN_JOURNEY.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_JOURNEY.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
