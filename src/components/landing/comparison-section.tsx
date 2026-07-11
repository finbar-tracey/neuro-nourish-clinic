import { Check, X } from "lucide-react";
import {
  Section,
  SectionCta,
  SectionHeader,
} from "@/components/landing/layout";
import {
  META_LP_COMPARISON_LENDER_TYPES,
  META_LP_COMPARISON_ROWS,
} from "@/lib/meta-lp-copy";

export function ComparisonSection() {
  return (
    <Section className="bg-white" width="narrow">
      <SectionHeader
        eyebrow="Why Choose Us"
        title="Specialist Broker vs High-Street Bank"
        description="Banks are built for standard mortgages. We are a specialist broker introducing deals that need flexibility and access to 200+ lenders."
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-3 bg-navy text-sm font-semibold text-white">
            <div className="p-4 md:p-5" />
            <div className="relative border-l border-white/10 bg-gold/20 p-4 text-center md:p-5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy shadow-sm">
                Recommended
              </span>
              Bridging Loans Broker
            </div>
            <div className="border-l border-white/10 p-4 text-center text-slate-300 md:p-5">
              High-Street Bank
            </div>
          </div>
          {META_LP_COMPARISON_ROWS.map(({ label, blb, bank }, i) => (
            <div
              key={label}
              className={`grid grid-cols-3 text-sm ${
                i % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <div className="border-t border-slate-100 p-4 font-medium text-navy md:p-5">
                {label}
              </div>
              <div className="flex items-start gap-2.5 border-l border-t border-slate-100 bg-gold/5 p-4 font-medium text-navy md:p-5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                {blb}
              </div>
              <div className="flex items-start gap-2.5 border-l border-t border-slate-100 p-4 text-slate-600 md:p-5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                {bank}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {META_LP_COMPARISON_LENDER_TYPES.map((type) => (
          <span
            key={type}
            className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-navy"
          >
            {type}
          </span>
        ))}
      </div>

      <SectionCta
        label="Start Free Enquiry"
        note="Free consultation · Typical response within 2 hours"
        showPhone
      />
    </Section>
  );
}
