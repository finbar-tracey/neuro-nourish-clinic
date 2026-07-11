import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  /** Full label for title attribute */
  title?: string;
};

type Props = {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  /** id applied to the selected pill (for focus / labels) */
  activeId?: string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

export function OptionPills({
  options,
  value,
  onChange,
  activeId,
  columns = 2,
  className,
}: Props) {
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={cn("grid gap-1.5", gridClass, className)} role="group">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            id={selected ? activeId : undefined}
            title={opt.title ?? opt.label}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex min-h-[48px] items-center justify-center rounded-lg border px-2.5 py-2.5 text-center text-xs font-medium leading-snug transition sm:min-h-[44px]",
              selected
                ? "border-gold bg-gold/10 text-navy ring-2 ring-gold/40"
                : "border-slate-200 text-slate-600 hover:border-gold/50 active:scale-[0.98] active:bg-gold/5",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
