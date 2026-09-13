import {
  Children,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Global NeuroNourish marketing card — white elevated surface, muted gold hairline.
 * Pair with NnCardGrid so cards stretch to the tallest in the row on every breakpoint.
 */

type NnCardProps = {
  as?: "article" | "div" | "li";
  eyebrow?: ReactNode;
  title?: ReactNode;
  body?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Pinned to the bottom for aligned CTAs across a row */
  footer?: ReactNode;
  featured?: boolean;
  align?: "left" | "center";
  hideHairline?: boolean;
  className?: string;
  children?: ReactNode;
};

export function NnCard({
  as = "article",
  eyebrow,
  title,
  body,
  icon,
  badge,
  footer,
  featured = false,
  align = "left",
  hideHairline = false,
  className = "",
  children,
}: NnCardProps) {
  const Tag = as as ElementType;
  const hasHeader = Boolean(icon || badge || eyebrow || title);

  return (
    <Tag
      className={`nn-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-[0_8px_24px_rgba(26,51,72,0.07)] ${
        featured ? "border-gold/35 bg-white" : "border-mist/90 bg-white"
      } ${align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      {!hideHairline ? (
        <div
          className={`absolute inset-x-0 top-0 h-0.5 ${featured ? "bg-gold/50" : "bg-gold/30"}`}
          aria-hidden
        />
      ) : null}

      {icon ? (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/12 ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {icon}
        </div>
      ) : null}

      {badge ? <div className={icon ? "mt-3" : undefined}>{badge}</div> : null}

      {eyebrow ? (
        <p className={`nn-eyebrow text-gold ${icon || badge ? "mt-3" : ""}`}>{eyebrow}</p>
      ) : null}

      {title ? (
        <h3
          className={`nn-display-card text-deep-slate ${
            eyebrow || icon || badge ? "mt-2" : ""
          }`}
        >
          {title}
        </h3>
      ) : null}

      <div className={`flex min-h-0 flex-1 flex-col ${hasHeader ? "mt-2" : ""}`}>
        {body ? <div className="text-sm leading-relaxed text-ink/75">{body}</div> : null}
        {children}
      </div>

      {footer ? <div className="mt-auto pt-5">{footer}</div> : null}
    </Tag>
  );
}

export type NnCardGridColumns = 1 | 2 | 3 | 4;

/**
 * Pick a balanced column count from the number of cards.
 * - 2 → 2 across (never a lonely single beside empty space on sm+)
 * - 3 → 3 across (never 2+1)
 * - 4 → 2×2
 * - 6 → 3×2
 * - 5/7 → 3-across (accept a short last row rather than 2+1 of a trio)
 */
export function nnCardGridColumns(count: number): NnCardGridColumns {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) return 4;
  if (count % 3 === 0) return 3;
  if (count % 2 === 0) return 2;
  return 3;
}

function columnClass(columns: NnCardGridColumns): string {
  switch (columns) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-1 sm:grid-cols-2";
    case 3:
      /* Full trio from sm — never 2+1 orphan row. */
      return "grid-cols-1 sm:grid-cols-3";
    case 4:
      /* 2×2 from sm. */
      return "grid-cols-1 sm:grid-cols-2";
    default:
      return "grid-cols-1";
  }
}

type NnCardGridProps = {
  children: ReactNode;
  /**
   * Desktop/tablet column layout. Prefer matching the card count:
   * 2→2, 3→3, 4→2×2. Omit to auto-detect from children.
   */
  columns?: NnCardGridColumns;
  className?: string;
  as?: "div" | "ul" | "ol";
};

/**
 * Equal-height card grid. Children should be NnCard (or wrappers that fill height).
 * Mobile: 1 column. From `sm`: balanced columns — never a 2+1 for a set of 3.
 */
export function NnCardGrid({
  children,
  columns,
  className = "",
  as = "div",
}: NnCardGridProps) {
  const Tag = as as ElementType;
  const count = Children.toArray(children).filter(Boolean).length;
  const resolved = columns ?? nnCardGridColumns(count);

  return (
    <Tag
      data-cols={resolved}
      className={`nn-card-grid grid gap-4 sm:gap-5 lg:gap-6 ${columnClass(resolved)} ${className}`}
    >
      {children}
    </Tag>
  );
}
