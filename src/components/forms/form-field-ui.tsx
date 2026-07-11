import { cn } from "@/lib/utils";
import { Check, Lock, PencilLine, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { FieldError, Input, Label } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/form-validation";
import { formatCurrency } from "@/lib/utils";
import { OptionPills } from "@/components/forms/option-pills";
import { QUICK_LOAN_PURPOSES } from "@/lib/ad-angles";
import { LOAN_PURPOSES } from "@/lib/validations";

export function FormExpandButton({
  children,
  onClick,
  className,
  icon = "plus",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  icon?: "plus" | "pencil";
}) {
  const Icon = icon === "pencil" ? PencilLine : Plus;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 px-4 text-sm font-semibold text-navy shadow-sm transition hover:border-gold/60 hover:bg-gold/10 active:scale-[0.99]",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
      {children}
    </button>
  );
}

export function SelectedValueChip({
  label,
  onChange,
  changeLabel = "Change",
}: {
  label: string;
  onChange: () => void;
  changeLabel?: string;
}) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-gold/35 bg-gold/10 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
        <span className="truncate text-sm font-semibold text-navy">{label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gold-ink ring-1 ring-gold/25 transition hover:bg-gold/5"
      >
        {changeLabel}
      </button>
    </div>
  );
}

export function FormErrorBanner({ errors }: { errors: Record<string, string> }) {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
    >
      <p className="font-semibold">Please check the following:</p>
      <ul className="mt-1 list-inside list-disc text-xs leading-relaxed sm:text-sm">
        {messages.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export function StepFieldProgress({
  items,
}: {
  items: { label: string; done: boolean }[];
}) {
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span
            key={item.label}
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              item.done ? "text-navy" : "text-slate-400",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                item.done ? "bg-gold text-navy" : "border border-slate-300 bg-white",
              )}
              aria-hidden
            >
              {item.done ? "✓" : ""}
            </span>
            {item.label}
          </span>
        ))}
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-gold-ink">
        {doneCount}/{items.length}
      </span>
    </div>
  );
}

export function StepCtaHint({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-center text-[11px] font-medium text-slate-600 md:hidden">
      {children}
    </p>
  );
}

type MoneyQuickPickerProps = {
  id: string;
  label: string;
  value: number | undefined;
  quickOptions: readonly { label: string; value: number }[];
  customOpen: boolean;
  onCustomOpenChange: (open: boolean) => void;
  onChange: (value: number | undefined) => void;
  error?: string;
  expandLabel?: string;
  placeholder?: string;
  /** One-tap shortcut e.g. match loan amount from step 1 */
  matchValue?: number;
  matchLabel?: string;
};

export function MoneyQuickPicker({
  id,
  label,
  value,
  quickOptions,
  customOpen,
  onCustomOpenChange,
  onChange,
  error,
  expandLabel = "Enter a different amount",
  placeholder = "250,000",
  matchValue,
  matchLabel = "Same as loan amount",
}: MoneyQuickPickerProps) {
  const isQuick = value !== undefined && quickOptions.some((o) => o.value === value);
  const showMatch =
    matchValue !== undefined &&
    matchValue >= 50000 &&
    value !== matchValue &&
    !customOpen;

  return (
    <div>
      <Label htmlFor={id} className="mb-1 sm:mb-1.5">
        {label}
      </Label>
      {showMatch && (
        <button
          type="button"
          onClick={() => {
            onChange(matchValue);
            onCustomOpenChange(false);
          }}
          className="mb-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-3 text-sm font-semibold text-navy transition hover:bg-gold/15 active:scale-[0.99]"
        >
          <Check className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
          {matchLabel}: {formatCurrency(matchValue)}
        </button>
      )}
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
        {quickOptions.map(({ label: optLabel, value: optValue }) => (
          <button
            key={optValue}
            type="button"
            onClick={() => {
              onChange(optValue);
              onCustomOpenChange(false);
            }}
            className={cn(
              "min-h-[48px] rounded-xl border px-3 py-2.5 text-sm font-semibold transition sm:min-h-0 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
              value === optValue && !customOpen
                ? "border-gold bg-gold/10 text-navy ring-2 ring-gold/40"
                : "border-slate-200 text-slate-600 hover:border-gold/50 active:scale-[0.98]",
            )}
          >
            {optLabel}
          </button>
        ))}
      </div>

      {customOpen ? (
        <div className="space-y-2">
          <Input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={formatMoneyInput(value)}
            onChange={(e) => onChange(parseMoneyInput(e.target.value))}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => onCustomOpenChange(false)}
            className="text-sm font-semibold text-gold-ink underline-offset-2 hover:underline"
          >
            ← Back to quick amounts
          </button>
        </div>
      ) : (
        <>
          {value !== undefined && value > 0 && !isQuick && (
            <SelectedValueChip
              label={formatCurrency(value)}
              onChange={() => onCustomOpenChange(true)}
              changeLabel="Edit"
            />
          )}
          {(!value || isQuick) && (
            <FormExpandButton
              onClick={() => onCustomOpenChange(true)}
              icon={isQuick ? "pencil" : "plus"}
            >
              {expandLabel}
            </FormExpandButton>
          )}
        </>
      )}

      <FieldError message={error} />
      {!customOpen && !value && (
        <p className="mt-1.5 text-[11px] text-slate-500">
          Minimum £50,000 · No obligation
        </p>
      )}
    </div>
  );
}

const EXTRA_LOAN_PURPOSES = LOAN_PURPOSES.filter(
  (p) => !QUICK_LOAN_PURPOSES.some((q) => q.value === p.value),
);

export function LoanPurposePicker({
  id,
  value,
  onChange,
  error,
  showAll,
  onShowAllChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showAll: boolean;
  onShowAllChange: (open: boolean) => void;
}) {
  const isQuick = QUICK_LOAN_PURPOSES.some((p) => p.value === value);
  const selectedLabel = LOAN_PURPOSES.find((p) => p.value === value)?.label;
  const showExtras =
    showAll || Boolean(value && !isQuick);

  return (
    <div>
      <Label htmlFor={id} className="mb-1 sm:mb-1.5">
        What do you need funding for?
      </Label>
      <OptionPills
        options={QUICK_LOAN_PURPOSES.map((p) => ({
          value: p.value,
          label: `${"emoji" in p ? `${p.emoji} ` : ""}${p.label}`,
          title: LOAN_PURPOSES.find((lp) => lp.value === p.value)?.label,
        }))}
        value={value}
        onChange={onChange}
        activeId={id}
        columns={3}
        className="gap-1.5 sm:gap-2"
      />
      {value && !isQuick && !showAll && selectedLabel && (
        <div className="mt-2">
          <SelectedValueChip
            label={selectedLabel}
            onChange={() => onShowAllChange(true)}
            changeLabel="Change"
          />
        </div>
      )}
      {!showExtras && (
        <FormExpandButton
          onClick={() => onShowAllChange(true)}
          className="mt-2"
          icon="plus"
        >
          More funding options
        </FormExpandButton>
      )}
      {showExtras && EXTRA_LOAN_PURPOSES.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-slate-600">Additional funding types</p>
          <OptionPills
            options={EXTRA_LOAN_PURPOSES.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            value={value}
            onChange={onChange}
            columns={2}
            className="gap-1.5"
          />
          {showAll && isQuick && (
            <button
              type="button"
              onClick={() => onShowAllChange(false)}
              className="text-sm font-semibold text-gold-ink underline-offset-2 hover:underline"
            >
              ← Show common options only
            </button>
          )}
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

export function FormStepSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-xl bg-slate-100"
          style={{ width: i === rows - 1 ? "70%" : "100%" }}
        />
      ))}
      <p className="text-center text-xs font-medium text-slate-500">Loading next step…</p>
    </div>
  );
}

export function CaptureSavedBanner({ firstName }: { firstName?: string }) {
  const name = firstName?.trim();
  return (
    <div
      role="status"
      className="mb-3 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-900"
    >
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
      <p className="leading-snug">
        <strong>Details saved{name ? `, ${name}` : ""}.</strong> Daniel will call within{" "}
        <strong>2 hours</strong> — one last step for your free quote.
      </p>
    </div>
  );
}

export function Step2ValueProposition({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gold/25 bg-gradient-to-br from-gold/10 to-slate-50 px-3.5 py-3.5 sm:px-4 sm:py-4",
        className,
      )}
    >
      <p className="text-sm font-bold text-navy sm:text-base">Your property finance review</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
        Daniel has reviewed thousands of property finance scenarios and works with over{" "}
        <strong className="font-semibold text-navy">200 lenders</strong>.
      </p>
      <p className="mt-2 text-xs font-medium text-navy sm:text-sm">
        Complete the final step to see if your enquiry meets our broker criteria.
      </p>
    </div>
  );
}

export function StepBrokerNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600",
        className,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[11px] font-bold text-navy">
        DM
      </span>
      <span>
        <strong className="text-navy">Daniel Mehrnia</strong> will call you personally within{" "}
        <strong>2 hours</strong> — no call centre.
      </span>
    </p>
  );
}

export function SecureSaveNote() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
      <Lock className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
      Saved securely when you continue — we never share your details
    </p>
  );
}

export function FormStepPanel({
  stepKey,
  loading,
  children,
}: {
  stepKey: number;
  loading?: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return <FormStepSkeleton />;
  }

  return (
    <div key={stepKey} className="form-step-enter">
      {children}
    </div>
  );
}
