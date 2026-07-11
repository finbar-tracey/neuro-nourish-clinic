"use client";

import { useEffect, useState } from "react";

type HealthcareStickyCtaProps = {
  label?: string;
  href?: string;
};

export function HealthcareStickyCta({
  label = "Check availability",
  href = "#quote-form",
}: HealthcareStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("quote-form");
    if (!form) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1, rootMargin: "0px 0px -72px 0px" },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        href={href}
        className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-gold text-sm font-semibold text-navy shadow-md"
      >
        {label}
      </a>
    </div>
  );
}
