import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_FAQ } from "@/lib/neuronourish-copy";

type FaqItem = (typeof NN_FAQ.items)[number];

function FaqAccordion({
  items,
  defaultOpenIndex = 0,
}: {
  items: readonly FaqItem[];
  defaultOpenIndex?: number;
}) {
  return (
    <div className="nn-faq-accordion rounded-2xl border border-mist bg-linen/30 p-2 sm:p-3">
      {items.map((item, index) => (
        <details
          key={item.q}
          className="nn-faq-item group rounded-xl border border-transparent px-3 py-1 open:border-gold/20 open:bg-gold/5 sm:px-4"
          open={index === defaultOpenIndex}
        >
          <summary className="flex min-h-[48px] w-full cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-medium text-slate-blue">
            <span className="pr-2">{item.q}</span>
            <span
              className="nn-faq-toggle inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-lg leading-none text-gold transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="pb-4 text-sm leading-[1.75] text-ink/75">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function FaqCtaBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <GoldButton href="/discovery">{NN_FAQ.cta}</GoldButton>
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
            <div className="mt-6 rounded-xl border border-mist/80 bg-white/65 p-4">
              <p className="text-xs leading-relaxed text-ink/65">{NN_FAQ.disclaimer}</p>
            </div>
            <FaqCtaBlock className="mt-8 hidden lg:flex" />
          </div>
          <FaqAccordion items={NN_FAQ.items} />
        </div>
        <div className="mt-10 flex flex-col items-center gap-1.5 border-t border-mist/80 pt-10 lg:hidden">
          <GoldButton href="/discovery">{NN_FAQ.cta}</GoldButton>
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
      <FaqAccordion items={items} defaultOpenIndex={-1} />
      <a href={ctaHref} className="nn-text-link mt-4 inline-block text-sm">
        {ctaLabel} →
      </a>
    </div>
  );
}
