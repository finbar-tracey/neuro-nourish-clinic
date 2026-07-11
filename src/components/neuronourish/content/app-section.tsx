import { GoldButton } from "@/components/neuronourish/shell";
import { AppPreviewVisual } from "@/components/neuronourish/content/app-preview-visual";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_APP } from "@/lib/neuronourish-copy";

/** Optional app fold — not shown on homepage (app is programme-client only). */
export function AppSection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="app" className={`nn-app-section border-t border-linen/80 ${className}`}>
      <PageContainer width="xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader
              eyebrow={NN_APP.eyebrow}
              headline={NN_APP.headline}
              subtext={NN_APP.subtext}
            />
            <CheckList items={NN_APP.benefits} className="mt-6" />
            <div className="mt-8 flex flex-col items-start gap-1.5">
              <GoldButton href="/programme">{NN_APP.cta}</GoldButton>
              <span className="text-xs text-ink/60">{NN_APP.ctaHint}</span>
            </div>
          </div>
          <AppPreviewVisual />
        </div>
      </PageContainer>
    </PageSection>
  );
}
