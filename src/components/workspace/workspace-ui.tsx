"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueFilterChip } from "@/lib/workspace-case";

export function WorkspacePageHeader({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-navy md:text-3xl">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function WorkspaceKpiCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "neutral" | "orange" | "red" | "green" | "violet" | "blue";
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const tones = {
    neutral: "border-slate-200 bg-white",
    orange: "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
    red: "border-red-200 bg-gradient-to-br from-red-50 to-white",
    green: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    violet: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
    blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
  };

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-xl font-bold text-navy md:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </>
  );

  const cardClassName = cn(
    "rounded-xl border p-4 shadow-sm transition",
    tones[tone],
    href && "hover:border-gold/40 hover:shadow-md",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardClassName, "block")}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClassName}>{inner}</div>;
}

export function WorkspaceStatPills({
  items,
}: {
  items: { label: string; value: string | number; tone?: string }[];
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm",
            item.tone,
          )}
        >
          <span className="text-slate-400">{item.label}</span>
          <span className="font-semibold text-navy">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export function WorkspaceToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspaceErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-semibold text-red-900 underline hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function WorkspaceEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50/80 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-navy">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function WorkspaceSkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-slate-200 border-l-4 border-l-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
          <div className="mt-1.5 flex gap-1">
            <div className="h-4 w-14 rounded-full bg-slate-100" />
            <div className="h-4 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="mt-1.5 h-3 w-full max-w-md rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function WorkspaceRefreshButton({
  loading,
  onClick,
}: {
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      <svg
        className={cn("h-4 w-4", loading && "animate-spin")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 3v6h-6" />
      </svg>
      Refresh
    </button>
  );
}

const FILTER_LABELS: Record<QueueFilterChip, string> = {
  all: "All",
  overdue: "Overdue",
  "due-today": "Due today",
};

export function WorkspaceFilterChips({
  value,
  onChange,
  counts,
}: {
  value: QueueFilterChip;
  onChange: (chip: QueueFilterChip) => void;
  counts: Record<QueueFilterChip, number>;
}) {
  const chips: QueueFilterChip[] = ["all", "overdue", "due-today"];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onChange(chip)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            value === chip
              ? "border-navy bg-navy text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            chip === "overdue" && value !== chip && counts.overdue > 0 && "border-red-200 text-red-700",
          )}
        >
          {FILTER_LABELS[chip]}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              value === chip ? "bg-white/20" : "bg-slate-100",
            )}
          >
            {counts[chip]}
          </span>
        </button>
      ))}
    </div>
  );
}

export function WorkspaceCollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details
      className="group rounded-xl border border-slate-200 bg-white shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {count}
          </span>
        </span>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="space-y-3 border-t border-slate-100 p-4 pt-3">{children}</div>
    </details>
  );
}
