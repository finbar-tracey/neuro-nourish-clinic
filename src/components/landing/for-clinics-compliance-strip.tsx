import { ClipboardCheck, ShieldCheck, Stethoscope } from "lucide-react";
import {
  HEALTHCARE_B2B_COMPLIANCE_ITEMS,
  HEALTHCARE_B2B_COMPLIANCE_SECTION,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const ICONS = {
  approval: ClipboardCheck,
  gdc: ShieldCheck,
  clinical: Stethoscope,
} as const;

export function ForClinicsComplianceStrip() {
  const section = HEALTHCARE_B2B_COMPLIANCE_SECTION;

  return (
    <div id="compliance" className="scroll-mt-24 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-gold-ink sm:text-xs">
          {section.title}
        </p>
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {HEALTHCARE_B2B_COMPLIANCE_ITEMS.map((item) => {
            const Icon = ICONS[item.id];
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-slate-200 bg-brand-cream/60 px-4 py-3 transition hover:border-gold/30 hover:shadow-sm",
                  "sm:flex-col sm:items-center sm:text-center sm:px-3 sm:py-4",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-gold sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
                </div>
                <div className="min-w-0 sm:space-y-1">
                  <p className="text-sm font-semibold leading-snug text-navy">{item.label}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
