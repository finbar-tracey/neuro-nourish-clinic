"use client";

import { useEffect, useState } from "react";
import { GOOGLE_REVIEWS, GOOGLE_RATING } from "@/lib/reviews";
import { StarRating } from "@/components/ui/star-rating";

const SNIPPETS = GOOGLE_REVIEWS.map((r) => ({
  name: r.name,
  text: r.text.length > 70 ? `${r.text.slice(0, 70)}…` : r.text,
}));

export function SocialProofBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SNIPPETS.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = SNIPPETS[index];

  return (
    <div className="border-b border-white/10 bg-navy-dark/90 py-2 sm:py-3">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Desktop: stars + rotating snippet */}
        <div className="hidden items-center justify-center gap-x-4 sm:flex">
          <div className="flex items-center gap-1.5">
            <StarRating size="xs" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gold">
              {GOOGLE_RATING.label}
            </span>
          </div>
          <span className="text-white/30">|</span>
          <p
            className={`text-center text-xs text-slate-200 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          >
            <span className="font-medium text-white">{current.name}</span>: &ldquo;
            {current.text}&rdquo;
          </p>
        </div>

        {/* Mobile: rotating review snippet — Google badge lives in sticky header */}
        <p
          className={`text-center text-[11px] leading-snug text-slate-200 transition-opacity duration-300 sm:hidden ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <span className="font-semibold text-white">{current.name}</span>
          <span className="text-slate-400"> · Google review · </span>
          &ldquo;{current.text.length > 88 ? `${current.text.slice(0, 88)}…` : current.text}&rdquo;
        </p>
      </div>
    </div>
  );
}
