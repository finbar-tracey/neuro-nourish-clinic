import { Building2, Clock, Globe, TrendingUp } from "lucide-react";
import {
  ctaPrimary,
  Section,
  SectionHeader,
} from "@/components/landing/layout";
import { ConversionTrustLine } from "@/components/landing/conversion-trust-line";
import { META_LP_KEY_FACTS, META_LP_STATS } from "@/lib/meta-lp-copy";

const STAT_ICONS = [TrendingUp, Building2, Globe, Clock] as const;

export function KeyFactsSection() {
  return (
    <Section className="bg-navy text-white" compact>
      <SectionHeader
        eyebrow="Why Investors Choose Us"
        title="Broker Facts at a Glance"
        description="Independent broker — we introduce enquiries to 200+ lenders. Introducer only, not a lender."
        dark
        className="mb-10"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {META_LP_STATS.map(({ value, label }, index) => {
          const Icon = STAT_ICONS[index] ?? Globe;
          return (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center"
            >
              <Icon className="mx-auto mb-3 h-5 w-5 text-gold" />
              <p className="font-display text-xl font-medium text-gold md:text-2xl">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-300">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {META_LP_KEY_FACTS.map(({ label, value, note }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="font-display text-lg font-medium text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a href="#quote-form" className={ctaPrimary}>
          Start Free Enquiry →
        </a>
        <ConversionTrustLine dark className="mt-4" />
      </div>
    </Section>
  );
}
