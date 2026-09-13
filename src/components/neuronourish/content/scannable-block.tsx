import type { ReactNode } from "react";
import { HighlightList } from "@/components/neuronourish/content/highlight-list";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";

type Tone = "default" | "card";

export function ScannableBlock({
  title,
  benefitFocus,
  highlights,
  tone = "default",
}: {
  title: string;
  benefitFocus?: string;
  highlights: readonly string[];
  tone?: Tone;
}) {
  if (tone === "card") {
    return (
      <NnCard
        badge={benefitFocus ? <span className="nn-badge">{benefitFocus}</span> : undefined}
        title={title}
      >
        <div className="mt-1">
          <HighlightList items={highlights} />
        </div>
      </NnCard>
    );
  }

  return (
    <article className="border-l-2 border-gold py-2 pl-6">
      {benefitFocus ? <span className="nn-badge mb-2">{benefitFocus}</span> : null}
      <h3 className="nn-display-card text-deep-slate">{title}</h3>
      <div className="mt-3">
        <HighlightList items={highlights} />
      </div>
    </article>
  );
}

export function ScannableGrid({
  children,
  columns,
}: {
  children: ReactNode;
  /** Omit to auto-balance from child count (2→2, 3→3, 4→2×2). */
  columns?: 1 | 2 | 3 | 4;
}) {
  if (columns === 1) {
    return <div className="mt-10 grid grid-cols-1 gap-4 sm:gap-5">{children}</div>;
  }

  return (
    <NnCardGrid className="mt-10" columns={columns}>
      {children}
    </NnCardGrid>
  );
}
