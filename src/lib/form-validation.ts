import { MIN_LOAN } from "@/lib/qualifications";

/** UK mobile domestically: 07 + 9 digits. */
const UK_MOBILE_DOMESTIC = /^07\d{9}$/;

/** Canonical CRM / SMS format. */
const UK_MOBILE_E164 = /^\+447\d{9}$/;

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** Normalise typed or pasted input to domestic 07… digits (max 11). */
export function toDomesticUKMobile(input: string): string {
  let digits = digitsOnly(input);

  if (digits.startsWith("44")) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 10 && digits.startsWith("7")) {
    digits = `0${digits}`;
  }

  return digits.slice(0, 11);
}

/** Format as the user types — always 07XXX XXX XXX. */
export function formatUKPhoneInput(input: string): string {
  const digits = toDomesticUKMobile(input);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

export function ukPhoneDigitCount(input: string): number {
  return toDomesticUKMobile(input).length;
}

export function isValidUKPhone(input: string): boolean {
  return UK_MOBILE_DOMESTIC.test(toDomesticUKMobile(input));
}

/** Specific form error; null when valid. */
export function ukPhoneValidationError(input: string): string | null {
  const trimmed = input.replace(/\s/g, "");
  if (!trimmed) return "Mobile number required";

  const digits = toDomesticUKMobile(input);
  if (digits.length > 0 && !digits.startsWith("07")) {
    return "Enter a UK mobile starting with 07";
  }
  if (digits.length < 11) {
    return `Enter 11 digits (${digits.length}/11)`;
  }
  if (!UK_MOBILE_DOMESTIC.test(digits)) {
    return "Enter a valid UK mobile number";
  }
  return null;
}

/** Store every lead as +447XXXXXXXXX. Only call after validation. */
export function normalizeUKPhone(input: string): string {
  const domestic = toDomesticUKMobile(input);
  if (!UK_MOBILE_DOMESTIC.test(domestic)) {
    throw new Error("Invalid UK mobile number");
  }
  return `+44${domestic.slice(1)}`;
}

/** Show stored E.164 or legacy 07… numbers consistently in the workspace. */
export function formatUKPhoneDisplay(input: string): string {
  if (!input) return input;
  const compact = input.replace(/\s/g, "");
  if (UK_MOBILE_E164.test(compact) || UK_MOBILE_DOMESTIC.test(toDomesticUKMobile(compact))) {
    return formatUKPhoneInput(toDomesticUKMobile(compact));
  }
  return input;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function validateLoanAmount(amount: number | undefined): string | null {
  if (!amount || amount < 1) return "Required";
  if (amount < MIN_LOAN) return `Minimum loan is £${MIN_LOAN.toLocaleString("en-GB")}`;
  return null;
}

/** Parse typed currency e.g. "250,000" → 250000 */
export function parseMoneyInput(raw: string): number | undefined {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function formatMoneyInput(amount: number | undefined): string {
  if (!amount) return "";
  return amount.toLocaleString("en-GB");
}

export const FORM_STORAGE_KEY = "blb_quote_form_v1";

/** Ad URL params for pre-filling step 1 */
export function parseFormUrlParams(search: string): {
  loanAmount?: number;
  loanPurpose?: string;
  timeframe?: string;
} {
  const params = new URLSearchParams(search);
  const amountRaw = params.get("amount") ?? params.get("loan");
  const loanAmount = amountRaw ? parseMoneyInput(amountRaw) : undefined;
  const loanPurpose = params.get("purpose") ?? undefined;
  const timeframe = params.get("timeframe") ?? undefined;
  return {
    loanAmount: loanAmount && loanAmount >= MIN_LOAN ? loanAmount : undefined,
    loanPurpose: loanPurpose || undefined,
    timeframe: timeframe || undefined,
  };
}
