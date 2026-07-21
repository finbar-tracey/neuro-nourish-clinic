"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NN_NAV } from "@/lib/neuronourish-copy";

/**
 * Mobile sticky quiz CTA for the home funnel.
 * Hides when the closing CTA (#get-started) is in view so we don't stack CTAs.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const closing = document.getElementById("get-started");
    const hero = document.querySelector(".nn-hero");

    const update = () => {
      const scrolled = window.scrollY > 420;
      let closingVisible = false;
      if (closing) {
        const rect = closing.getBoundingClientRect();
        closingVisible = rect.top < window.innerHeight * 0.85;
      }
      setVisible(scrolled && !closingVisible);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let observer: IntersectionObserver | undefined;
    if (closing || hero) {
      observer = new IntersectionObserver(() => update(), {
        threshold: [0, 0.12, 0.5],
        rootMargin: "0px 0px -60px 0px",
      });
      if (closing) observer.observe(closing);
      if (hero) observer.observe(hero);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory/10 bg-deep-slate/95 p-3 shadow-[0_-8px_28px_rgba(26,51,72,0.35)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href="/quiz"
        className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-6 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90"
      >
        {NN_NAV.ctaQuizShort}
      </Link>
    </div>
  );
}
