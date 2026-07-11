import Link from "next/link";
import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { ctaPrimary } from "@/components/landing/layout";
import { HEALTHCARE_FOR_CLINICS } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#pilot-offer", label: "Pilot pricing" },
  { href: "#comparison", label: "Why us" },
  { href: "#faq", label: "FAQ" },
] as const;

export function ForClinicsHeader() {
  const copy = HEALTHCARE_FOR_CLINICS;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <BookedConsultMark variant="compact" theme="light" href="/for-clinics" />
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Page sections">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-slate-600 transition hover:text-navy"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/lp/implants"
            className="text-sm font-medium text-gold-ink underline underline-offset-2 hover:text-navy"
          >
            {copy.patientDemoLabel}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#pilot-offer"
            className="hidden text-xs font-medium text-slate-600 hover:text-navy sm:inline sm:text-sm lg:hidden"
          >
            {copy.pilotPricingLabel}
          </Link>
          <SalesCalendlyLink
            className={cn(
              ctaPrimary,
              "min-h-[40px] px-3 py-2 text-xs sm:min-h-[44px] sm:px-5 sm:text-sm",
            )}
          >
            <span className="sm:hidden">{copy.ctaShort}</span>
            <span className="hidden sm:inline">{copy.cta}</span>
          </SalesCalendlyLink>
        </div>
      </div>
    </header>
  );
}
