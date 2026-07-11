"use client";

import { useEffect, useState } from "react";
import { salesCalendlyUrl } from "@/lib/for-clinics-config";
import { HEALTHCARE_FOR_CLINICS } from "@/lib/healthcare-lp-copy";

export function ForClinicsStickyCta() {
  const [visible, setVisible] = useState(false);
  const calendlyUrl = salesCalendlyUrl();
  const scrollTarget = calendlyUrl.startsWith("#") ? calendlyUrl : "#calendly-booking";

  useEffect(() => {
    const hero = document.getElementById("for-clinics-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-white/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        href={scrollTarget}
        className="flex min-h-[48px] w-full flex-col items-center justify-center rounded-lg bg-gold px-3 py-2 text-navy shadow-md"
      >
        <span className="text-sm font-semibold">{HEALTHCARE_FOR_CLINICS.cta}</span>
        <span className="text-[11px] font-medium text-navy/70">{HEALTHCARE_FOR_CLINICS.ctaNote}</span>
      </a>
    </div>
  );
}
