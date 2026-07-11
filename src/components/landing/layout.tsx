import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ConversionTrustLine } from "@/components/landing/conversion-trust-line";
import { PhoneLink } from "@/components/landing/phone-link";

/** Shared layout tokens — single source for section rhythm */
export const sectionPadding = "py-12 md:py-20";
export const sectionPaddingCompact = "py-10 md:py-16";
export const sectionPaddingBand = "py-10 md:py-14";
export const containerX = "px-4 sm:px-6";
export const containerMax = "mx-auto max-w-6xl";
export const containerNarrow = "mx-auto max-w-4xl";
export const containerTight = "mx-auto max-w-3xl";

export const ctaPrimary =
  "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-md transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink sm:px-8 sm:py-3.5";

export const ctaSecondary =
  "inline-flex items-center justify-center rounded-lg bg-navy px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export const ctaOutlineLight =
  "inline-flex items-center justify-center rounded-lg border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10";

export const cardBase =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type SectionProps = {
  id?: string;
  className?: string;
  innerClassName?: string;
  width?: "default" | "narrow" | "tight";
  compact?: boolean;
  band?: boolean;
  children: ReactNode;
};

export function Section({
  id,
  className,
  innerClassName,
  width = "default",
  compact,
  band,
  children,
}: SectionProps) {
  const widthClass =
    width === "narrow"
      ? containerNarrow
      : width === "tight"
        ? containerTight
        : containerMax;

  const py = band ? sectionPaddingBand : compact ? sectionPaddingCompact : sectionPadding;

  return (
    <section id={id} className={cn(py, className)}>
      <div className={cn(widthClass, containerX, innerClassName)}>{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  dark?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  dark,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-ink">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-2xl font-medium capitalize md:text-3xl lg:text-[2rem] lg:leading-tight",
          dark ? "text-white" : "text-navy",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            dark ? "text-slate-300" : "text-slate-600",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

type SectionCtaProps = {
  href?: string;
  label?: string;
  note?: string;
  variant?: "primary" | "secondary";
  className?: string;
  showTrust?: boolean;
  showPhone?: boolean;
  trustDark?: boolean;
};

export function SectionCta({
  href = "#quote-form",
  label = "Get My Free Quote",
  note,
  variant = "primary",
  className,
  showTrust = true,
  showPhone = false,
  trustDark = false,
}: SectionCtaProps) {
  return (
    <div className={cn("mt-12 text-center", className)}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={href}
          className={variant === "primary" ? ctaPrimary : ctaSecondary}
        >
          {label}
        </a>
        {showPhone && (
          <PhoneLink
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-slate-50"
          >
            020 7177 4141
          </PhoneLink>
        )}
      </div>
      {note && <p className="mt-3 text-xs text-slate-600">{note}</p>}
      {showTrust && (
        <ConversionTrustLine className="mt-4" dark={trustDark} />
      )}
    </div>
  );
}

export function ContentCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(cardBase, className)}>{children}</div>;
}
