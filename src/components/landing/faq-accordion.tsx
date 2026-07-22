"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type LandingFaqItem = {
  q: string;
  a: string;
  id?: string;
  highlight?: boolean;
  /** Optional leading badge in the summary (e.g. Meta LP “No risk”) */
  badge?: ReactNode;
};

type LandingFaqAccordionProps = {
  items: readonly LandingFaqItem[];
  defaultOpenIndex?: number;
  /** When set, opens the item whose `id` matches (takes priority over defaultOpenIndex). */
  defaultOpenId?: string;
  groupName?: string;
  className?: string;
  itemClassName?: string;
};

/**
 * Shared landing/healthcare FAQ accordion — exclusive open, gold + toggle, focus-visible.
 * Keeps Meta / implants / for-clinics navy–cream tokens (not NeuroNourish linen).
 */
export function LandingFaqAccordion({
  items,
  defaultOpenIndex = 0,
  defaultOpenId,
  groupName,
  className = "",
  itemClassName = "",
}: LandingFaqAccordionProps) {
  const reactId = useId();
  const name = groupName ?? `landing-faq-${reactId}`;

  const initialIndex = (() => {
    if (defaultOpenId) {
      const byId = items.findIndex((item) => item.id === defaultOpenId);
      if (byId >= 0) return byId;
    }
    return defaultOpenIndex;
  })();

  const [openIndex, setOpenIndex] = useState(initialIndex);

  return (
    <div
      className={cn(
        "landing-faq-accordion rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <details
          key={item.id ?? item.q}
          id={item.id}
          name={name}
          className={cn(
            "landing-faq-item group scroll-mt-24 rounded-xl border border-transparent px-3 py-1 open:border-gold/25 open:bg-gold/[0.06] sm:px-4",
            item.highlight && "open:ring-1 open:ring-gold/10",
            itemClassName,
          )}
          open={openIndex === index}
          onToggle={(event) => {
            const nextOpen = event.currentTarget.open;
            if (nextOpen) {
              setOpenIndex(index);
              return;
            }
            if (openIndex === index) {
              setOpenIndex(-1);
            }
          }}
        >
          <summary className="landing-faq-summary flex min-h-[48px] w-full cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-medium text-navy [&::-webkit-details-marker]:hidden">
            <span className="flex flex-1 items-start gap-3 pr-2 text-[15px] leading-snug md:text-base">
              {item.badge}
              {item.q}
            </span>
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-lg leading-none text-gold-ink transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <div className="pb-4 pr-10">
            <p className="max-w-[65ch] text-sm leading-[1.75] text-slate-600">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
