import type { ReactNode } from "react";
import { HighlightList } from "@/components/neuronourish/content/highlight-list";

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
  const wrapper =
    tone === "card"
      ? "rounded-2xl border border-mist bg-linen/35 p-6"
      : "border-l-2 border-gold py-2 pl-6";

  return (
    <article className={wrapper}>
      {benefitFocus ? <span className="nn-badge mb-2">{benefitFocus}</span> : null}
      <h3 className="nn-display-card text-slate-blue">{title}</h3>
      <div className="mt-3">
        <HighlightList items={highlights} />
      </div>
    </article>
  );
}

export function ScannableGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const colClass =
    columns === 3
      ? "md:grid-cols-2 lg:grid-cols-3"
      : columns === 1
        ? "grid-cols-1"
        : "md:grid-cols-2";

  return <div className={`mt-10 grid gap-6 ${colClass}`}>{children}</div>;
}
