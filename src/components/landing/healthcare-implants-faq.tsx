import { Section, SectionHeader } from "@/components/landing/layout";
import { HEALTHCARE_IMPLANTS_FAQ } from "@/lib/healthcare-lp-copy";
import { ChevronDown } from "lucide-react";

export function HealthcareImplantsFaq() {
  return (
    <Section className="bg-white" width="tight" compact>
      <SectionHeader
        title="Common questions"
        description="Straight answers before you book — free consultation, no obligation."
      />

      <div className="space-y-4">
        {HEALTHCARE_IMPLANTS_FAQ.map(({ q, a }, i) => (
          <details
            key={q}
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
            open={i === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-navy md:p-6">
              <span className="flex-1 text-left text-sm md:text-base">{q}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-gold-ink transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="border-t border-slate-100 px-5 pb-5 pt-4 md:px-6 md:pb-6">
              <p className="text-sm leading-relaxed text-slate-600">{a}</p>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href="#quote-form"
          className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy-light"
        >
          Book free consultation
        </a>
      </div>
    </Section>
  );
}
