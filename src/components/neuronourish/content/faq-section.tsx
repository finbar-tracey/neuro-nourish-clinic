import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnFaqAccordion } from "@/components/neuronourish/content/nn-faq-accordion";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_FAQ } from "@/lib/neuronourish-copy";

function FaqCtaBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <GoldButton href="/quiz">{NN_FAQ.cta}</GoldButton>
      <span className="text-xs text-ink/60">{NN_FAQ.ctaHint}</span>
    </div>
  );
}

export function FaqSection({ className = "", id }: { className?: string; id?: string }) {
  return (
    <PageSection id={id} className={`nn-faq-section border-t border-linen/80 ${className}`}>
      <PageContainer width="xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div>
            <SectionHeader
              eyebrow={NN_FAQ.eyebrow}
              headline={NN_FAQ.headline}
              subtext={NN_FAQ.subtext}
            />
            <div className="mt-6 rounded-xl border border-mist/80 bg-linen/25 p-4">
              <p className="text-xs leading-relaxed text-ink/65">{NN_FAQ.disclaimer}</p>
            </div>
            <FaqCtaBlock className="mt-8 hidden lg:flex" />
          </div>
          <NnFaqAccordion items={NN_FAQ.items} groupName="home-faq" defaultOpenIndex={0} />
        </div>
        <div className="mt-10 flex flex-col items-center gap-1.5 border-t border-mist/80 pt-10 lg:hidden">
          <GoldButton href="/quiz">{NN_FAQ.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_FAQ.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}

export function FaqSectionCompact({
  limit = 3,
  ctaHref = "/#faq",
  ctaLabel = "View all questions",
}: {
  limit?: number;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const items = NN_FAQ.items.slice(0, limit);

  return (
    <div>
      <NnFaqAccordion items={items} defaultOpenIndex={-1} groupName="home-faq-compact" />
      <a href={ctaHref} className="nn-text-link mt-4 inline-block text-sm">
        {ctaLabel} →
      </a>
    </div>
  );
}
