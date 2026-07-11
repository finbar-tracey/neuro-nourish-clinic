import { META_LP_FAQ } from "@/lib/meta-lp-copy";
import { Section, SectionCta, SectionHeader } from "@/components/landing/layout";
import { ChevronDown } from "lucide-react";

export function FaqSection() {
  return (
    <Section id="faq" className="bg-brand-cream" width="tight">
      <SectionHeader
        title="Frequently Asked Questions"
        description="Objections answered upfront — so you can enquire with confidence."
      />

      <div className="space-y-4">
        {META_LP_FAQ.map(({ q, a, category }, i) => (
          <details
            key={q}
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
            open={i === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-navy md:p-6">
              <span className="flex flex-1 items-start gap-3 text-left text-sm md:text-base">
                {category === "objection" && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    No risk
                  </span>
                )}
                {q}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-gold-ink transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-100 px-5 pb-5 pt-4 md:px-6 md:pb-6">
              <p className="text-sm leading-relaxed text-slate-600">{a}</p>
            </div>
          </details>
        ))}
      </div>

      <SectionCta
        label="Ready? Start Free Enquiry"
        note="No obligation · No hard credit check · 2-minute form"
        showPhone
      />
    </Section>
  );
}
