import Link from "next/link";
import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { HEALTHCARE_FOOTER } from "@/lib/healthcare-lp-copy";
import { healthcareClinicPublicName, partnerCity } from "@/lib/vertical-config";

export function HealthcareImplantsFooter() {
  const partner = healthcareClinicPublicName();
  const city = partnerCity();

  return (
    <footer className="bg-navy-dark py-14 text-xs text-slate-400 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <BookedConsultMark variant="footer" theme="dark" href="/lp/implants" />
          <p className="text-center text-sm text-slate-300 md:text-right">
            {partner} · {city}
          </p>
        </div>

        <p className="mx-auto max-w-3xl text-center leading-relaxed md:text-left">{HEALTHCARE_FOOTER}</p>
        <p className="mt-4 text-center md:text-left">
          <Link href="/privacy" className="underline hover:text-gold">
            Privacy policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
