import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NN_CLINICIAN_FAQ } from "@/lib/neuronourish-copy";

type ClinicianFaqItem = (typeof NN_CLINICIAN_FAQ.items)[number];

function ClinicianFaqAccordion({
  items,
  defaultOpenIndex = 0,
}: {
  items: readonly ClinicianFaqItem[];
  defaultOpenIndex?: number;
}) {
  return (
    <div className="nn-faq-accordion rounded-2xl border border-mist bg-white/90 p-2 shadow-sm sm:p-3">
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

export function ClinicianFaqSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`border-t border-linen/80 ${className}`}>
      <PageContainer width="lg">
        <h2 className="nn-display-section mb-8 text-center text-slate-blue">
          {NN_CLINICIAN_FAQ.headline}
        </h2>
        <ClinicianFaqAccordion items={NN_CLINICIAN_FAQ.items} />
      </PageContainer>
    </PageSection>
  );
}
