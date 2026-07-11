import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { healthcareClinicPublicName, partnerCity } from "@/lib/vertical-config";

export function HealthcareImplantsHeader() {
  const partner = healthcareClinicPublicName();
  const city = partnerCity();

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <BookedConsultMark variant="compact" theme="light" href="/lp/implants" />
        <p className="hidden text-xs text-slate-500 sm:block">
          Free consultation · {partner} · {city}
        </p>
      </div>
    </header>
  );
}
