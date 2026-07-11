import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  id: string;
  label: ReactNode;
  hint?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  error?: string;
};

export function YesNoField({ id, label, hint, value, onChange, error }: Props) {
  return (
    <fieldset>
      <legend className="mb-1 block text-xs font-medium text-navy sm:mb-1.5 sm:text-sm">{label}</legend>
      {hint && (
        <p className="mb-2 hidden text-xs leading-relaxed text-slate-500 sm:block">{hint}</p>
      )}
      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-2">
        {(
          [
            { val: false, label: "No" },
            { val: true, label: "Yes" },
          ] as const
        ).map(({ val, label: optLabel }) => (
          <button
            key={optLabel}
            type="button"
            id={val ? `${id}-yes` : `${id}-no`}
            onClick={() => onChange(val)}
            className={cn(
              "min-h-[48px] rounded-lg border px-3 py-3 text-sm font-medium transition sm:min-h-0 sm:py-2.5",
              value === val
                ? "border-gold bg-gold/10 text-navy ring-1 ring-gold/30"
                : "border-slate-200 text-slate-600 hover:border-gold/40",
            )}
          >
            {optLabel}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}
