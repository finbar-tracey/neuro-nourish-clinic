"use client";

import { useId, useState } from "react";

/**
 * Global NeuroNourish FAQ accordion — brand linen surface, gold toggle, exclusive open.
 * Use for home, clinics, shop, programme, discovery, and any future FAQ blocks.
 */
export type NnFaqItem = {
  q: string;
  a: string;
};

type NnFaqAccordionProps = {
  items: readonly NnFaqItem[];
  /** Index to open initially; use -1 for all closed. */
  defaultOpenIndex?: number;
  /** Shared group id so only one item is open. */
  groupName?: string;
  className?: string;
};

export function NnFaqAccordion({
  items,
  defaultOpenIndex = 0,
  groupName,
  className = "",
}: NnFaqAccordionProps) {
  const reactId = useId();
  const name = groupName ?? `nn-faq-${reactId}`;
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);

  return (
    <div
      className={`nn-faq-accordion rounded-2xl border border-mist bg-linen/30 p-2 sm:p-3 ${className}`}
    >
      {items.map((item, index) => (
        <details
          key={item.q}
          name={name}
          className="nn-faq-item group rounded-xl border border-transparent px-3 py-1 open:border-gold/25 open:bg-gold/[0.06] sm:px-4"
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
          <summary className="nn-faq-summary flex min-h-[48px] w-full cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-medium text-slate-blue">
            <span className="pr-2 text-[15px] leading-snug sm:text-base">{item.q}</span>
            <span
              className="nn-faq-toggle inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-lg leading-none text-gold transition-transform duration-200 group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <div className="nn-faq-answer pb-4 pr-10">
            <p className="max-w-[65ch] text-sm leading-[1.75] text-ink/75">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

type NnFaqBlockProps = {
  id: string;
  title: string;
  items: readonly NnFaqItem[];
  /** Defaults closed on page FAQs so the page doesn’t jump. */
  defaultOpenIndex?: number;
  groupName?: string;
  className?: string;
  /** Optional short intro under the title */
  subtext?: string;
};

/** Titled FAQ block for shop / programme / discovery-style pages. */
export function NnFaqBlock({
  id,
  title,
  items,
  defaultOpenIndex = -1,
  groupName,
  className = "",
  subtext,
}: NnFaqBlockProps) {
  return (
    <section className={`mx-auto w-full max-w-2xl ${className}`} aria-labelledby={id}>
      <h2 id={id} className="nn-display-section text-center text-slate-blue">
        {title}
      </h2>
      {subtext ? (
        <p className="nn-body mx-auto mt-3 max-w-xl text-center text-ink/70">{subtext}</p>
      ) : null}
      <NnFaqAccordion
        items={items}
        defaultOpenIndex={defaultOpenIndex}
        groupName={groupName ?? id}
        className="mt-8"
      />
    </section>
  );
}
