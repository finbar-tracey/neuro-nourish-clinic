import type { ElementType, ReactNode } from "react";

/**
 * Global NeuroNourish marketing card — linen surface, gold hairline, equal-height ready.
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
      className={`nn-card relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 sm:p-6 ${
        featured ? "border-gold/40 bg-linen/40" : "border-mist bg-linen/30"
      } ${align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      {!hideHairline ? (
        <div
          className={`absolute inset-x-0 top-0 h-0.5 ${featured ? "bg-gold/75" : "bg-gold/55"}`}
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
          className={`nn-display-card text-slate-blue ${
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

type NnCardGridProps = {
  children: ReactNode;
  /** Column count from `sm`/`lg`; always 1 col on mobile */
  columns?: 2 | 3;
  className?: string;
  as?: "div" | "ul" | "ol";
};

/**
 * Equal-height card grid. Children should be NnCard (or wrappers that fill height).
 * Mobile: 1 column. sm: 2. lg: 3 when columns=3.
 */
export function NnCardGrid({
  children,
  columns = 3,
  className = "",
  as = "div",
}: NnCardGridProps) {
  const Tag = as as ElementType;
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <Tag className={`nn-card-grid grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 ${cols} ${className}`}>
      {children}
    </Tag>
  );
}
