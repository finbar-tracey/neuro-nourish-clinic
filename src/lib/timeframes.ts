export const TIMEFRAMES = [
  { value: "urgent", label: "Within 7 days", short: "7 days" },
  { value: "30_days", label: "Within 30 days", short: "30 days" },
  { value: "90_days", label: "Within 90 days", short: "90 days" },
  { value: "researching", label: "Just researching", short: "Researching" },
] as const;

export type TimeframeValue = (typeof TIMEFRAMES)[number]["value"];

/** Legacy values kept for CRM records created before the pill refresh */
const LEGACY_TIMEFRAMES = [
  { value: "2_weeks", label: "Within 2 weeks", short: "2 weeks" },
  { value: "1_month", label: "Within 1 month", short: "1 month" },
  { value: "3_months", label: "Within 3 months", short: "3 months" },
  { value: "over_3_months", label: "More than 3 months", short: "3+ months" },
  { value: "flexible", label: "Flexible", short: "Flexible" },
] as const;

/** Quick-pick options shown as pills on step 1 */
export const QUICK_TIMEFRAMES = TIMEFRAMES;

/** Researching / legacy long timelines → nurture path */
export function isLongTimeframe(value: string | undefined | null): boolean {
  if (!value) return false;
  return (
    value === "researching" ||
    value === "over_3_months" ||
    value === "flexible"
  );
}

type TimeframeOption = { value: string; label: string; short: string };

const ALL_TIMEFRAMES: TimeframeOption[] = [...TIMEFRAMES, ...LEGACY_TIMEFRAMES];

export function timeframeLabel(value: string): string {
  const match = ALL_TIMEFRAMES.find((t) => t.value === value);
  return match?.label ?? value;
}

/** Short label for form chips and thank-you summary */
export function timeframeShortLabel(value: string): string {
  const match = ALL_TIMEFRAMES.find((t) => t.value === value);
  if (!match) return value;
  return match.short ?? match.label;
}
