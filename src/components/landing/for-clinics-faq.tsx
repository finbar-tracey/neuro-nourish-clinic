import Link from "next/link";
import { Mail, ChevronDown } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import { salesContactEmailDisplay } from "@/lib/for-clinics-config";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_FAQ,
  HEALTHCARE_FOR_CLINICS_FAQ_CATEGORIES,
  HEALTHCARE_FOR_CLINICS_FAQ_SECTION,
  type HealthcareForClinicsFaqCategory,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: HealthcareForClinicsFaqCategory[] = ["pilot", "delivery", "after"];

function faqByCategory(category: HealthcareForClinicsFaqCategory) {
  return HEALTHCARE_FOR_CLINICS_FAQ.filter((item) => item.category === category);
}

export function ForClinicsFaq() {
  const section = HEALTHCARE_FOR_CLINICS_FAQ_SECTION;
  const email = salesContactEmailDisplay();

  return (
    <Section id="faq" className="scroll-mt-24 bg-brand-cream">
      <span id="contact" className="sr-only" aria-hidden />
      <SectionHeader
        align="left"
        title={section.title}
        description={section.description}
        className="mb-6 text-left md:mb-8 [&_h2]:text-left"
      />

      <nav
        aria-label="FAQ categories"
        className="mb-8 flex flex-wrap gap-2"
      >
        {CATEGORY_ORDER.map((category) => (
          <a
            key={category}
            href={`#faq-${category}`}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:border-gold/40 hover:bg-gold/5"
          >
            {HEALTHCARE_FOR_CLINICS_FAQ_CATEGORIES[category]}
          </a>
        ))}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-12">
        <div className="space-y-10">
          {CATEGORY_ORDER.map((category) => {
            const items = faqByCategory(category);
            if (items.length === 0) return null;

            return (
              <section key={category} id={`faq-${category}`} className="scroll-mt-24">
                <h3 className="mb-4 font-display text-lg font-medium text-navy">
                  {HEALTHCARE_FOR_CLINICS_FAQ_CATEGORIES[category]}
                </h3>
                <div className="space-y-3">
                  {items.map(({ id, q, a, highlight }) => (
                      <details
                        key={id}
                        id={id}
                        className={cn(
                          "group scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                          highlight
                            ? "border-gold/30 ring-1 ring-gold/10"
                            : "border-slate-200",
                        )}
                        open={id === "faq-pricing"}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5 [&::-webkit-details-marker]:hidden">
                          <span className="flex-1 text-left text-sm font-semibold text-navy md:text-base">
                            {q}
                          </span>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-cream text-gold-ink transition group-open:bg-gold/15">
                            <ChevronDown
                              className="h-4 w-4 transition group-open:rotate-180"
                              aria-hidden
                            />
                          </span>
                        </summary>
                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-4 md:px-6 md:pb-6">
                          <p className="text-sm leading-relaxed text-slate-700">{a}</p>
                        </div>
                      </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100">
            <div className="border-b border-gold/20 bg-navy px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">Quick answers</p>
            </div>
            <div className="space-y-1 p-3">
              {HEALTHCARE_FOR_CLINICS_FAQ.filter((item) => item.highlight).map(({ id, q }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy transition hover:bg-brand-cream/80"
                >
                  {q}
                </a>
              ))}
            </div>
            <div className="border-t border-slate-100 p-5">
              <p className="font-display text-lg font-medium text-navy">{section.ctaTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.ctaDescription}</p>
              <SalesCalendlyLink className={cn(ctaPrimary, "mt-4 w-full min-h-[48px] text-sm shadow-md")}>
                {HEALTHCARE_FOR_CLINICS.cta}
              </SalesCalendlyLink>
              <p className="mt-2 text-center text-xs text-slate-500">{HEALTHCARE_FOR_CLINICS.ctaNote}</p>
              <a
                href={`mailto:${email}`}
                className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-gold-ink hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {section.emailLabel}
              </a>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600 lg:text-left">
            See full pilot scope in the{" "}
            <Link href="#pilot-offer" className="font-semibold text-gold-ink underline underline-offset-2">
              pilot offer
            </Link>
            .
          </p>
        </aside>
      </div>
    </Section>
  );
}
