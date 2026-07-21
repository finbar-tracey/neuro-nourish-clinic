"use client";

import { useEffect } from "react";

/**
 * One-shot scroll reveal for `.nn-reveal` sections.
 * CSS-only motion; unobserves after first intersect. No animation library.
 */
export function NnScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".nn-reveal"));
    if (nodes.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      for (const el of nodes) el.classList.add("is-inview");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    for (const el of nodes) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return null;
}
