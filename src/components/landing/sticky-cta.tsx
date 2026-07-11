"use client";

import { useEffect, useState } from "react";
import { PhoneLink } from "@/components/landing/phone-link";
import { Phone } from "lucide-react";

export function StickyCta() {
  const [visible, setVisible] = useState(true);
  const [formFocused, setFormFocused] = useState(false);

  useEffect(() => {
    const form = document.getElementById("quote-form");
    if (!form) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.12, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(form);

    const onFocusIn = () => setFormFocused(true);
    const onFocusOut = (e: FocusEvent) => {
      if (!form.contains(e.relatedTarget as Node)) setFormFocused(false);
    };
    form.addEventListener("focusin", onFocusIn);
    form.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      form.removeEventListener("focusin", onFocusIn);
      form.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (!visible || formFocused) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex gap-2">
        <PhoneLink className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border border-navy/20 text-sm font-semibold text-navy">
          <Phone className="h-4 w-4" />
          Call
        </PhoneLink>
        <a
          href="#quote-form"
          className="flex min-h-[48px] flex-[1.35] items-center justify-center rounded-lg bg-gold text-sm font-semibold text-navy shadow-md"
        >
          Free Enquiry
        </a>
      </div>
    </div>
  );
}
