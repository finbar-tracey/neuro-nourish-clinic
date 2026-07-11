import Link from "next/link";
import { Mail } from "lucide-react";
import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { ctaPrimary } from "@/components/landing/layout";
import { salesContactEmailDisplay } from "@/lib/for-clinics-config";
import {
  HEALTHCARE_FOOTER,
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_FOOTER_NAV,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

export function ForClinicsFooter() {
  const email = salesContactEmailDisplay();
  const copy = HEALTHCARE_FOR_CLINICS;
  const nav = HEALTHCARE_FOR_CLINICS_FOOTER_NAV;

  return (
    <footer className="bg-navy-dark py-14 text-xs text-slate-400 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
          <div>
            <BookedConsultMark variant="footer" theme="dark" href="/for-clinics" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {copy.subline}
            </p>
            <SalesCalendlyLink
              className={cn(ctaPrimary, "mt-5 min-h-[44px] text-sm shadow-md")}
            >
              {copy.cta}
            </SalesCalendlyLink>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">Product</p>
            <ul className="space-y-2 text-sm">
              {nav.product.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-slate-300 transition hover:text-gold">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">Support</p>
            <ul className="space-y-2 text-sm">
              {nav.support.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-300 transition hover:text-gold"
                    {...(href.startsWith("/") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${email}`}
              className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-gold"
            >
              <Mail className="h-4 w-4 text-gold" aria-hidden />
              {email}
            </a>
          </div>
        </div>

        <p className="mt-8 max-w-3xl leading-relaxed">{HEALTHCARE_FOOTER}</p>
        <p className="mt-4">
          <Link href="/privacy" className="underline hover:text-gold">
            Privacy policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
