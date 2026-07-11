/** Irish + UK mobile normalisation for NeuroNourish (Ireland-based clinic). */

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** Domestic digit count for live hints (IE 10 / UK 11). */
export function phoneDigitCount(input: string): number {
  const digits = digitsOnly(input);
  if (digits.startsWith("353")) return Math.min(digits.slice(3).length + 1, 10); // treat as 0 + national
  if (digits.startsWith("44")) return Math.min(digits.slice(2).length + 1, 11);
  return digits.length;
}

export function phoneExpectedLength(input: string): 10 | 11 | null {
  const digits = digitsOnly(input);
  if (!digits) return null;
  if (
    digits.startsWith("08") ||
    digits.startsWith("3538") ||
    (digits.startsWith("8") && !digits.startsWith("44") && digits.length <= 9)
  ) {
    return 10;
  }
  if (digits.startsWith("07") || digits.startsWith("447") || digits.startsWith("44")) {
    return 11;
  }
  return null;
}

/** Live helper under the field — empty when complete/valid. */
export function phoneDigitHint(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "Irish 08… (10 digits) or UK 07… (11 digits)";
  if (isValidPhone(input)) return null;
  const digits = digitsOnly(input);
  const expected = phoneExpectedLength(input);
  const count = phoneDigitCount(input);

  if (digits.startsWith("01") || digits.startsWith("02") || digits.startsWith("03")) {
    return "Use a mobile (08… or 07…), not a landline";
  }
  if (digits.startsWith("0") && !digits.startsWith("07") && !digits.startsWith("08")) {
    return "Mobile must start with 08 (Ireland) or 07 (UK)";
  }
  if (expected === 10) return `Irish mobile — ${Math.min(count, 10)}/10 digits`;
  if (expected === 11) return `UK mobile — ${Math.min(count, 11)}/11 digits`;
  if (digits.length > 0 && !digits.startsWith("0") && !digits.startsWith("353") && !digits.startsWith("44")) {
    return "Start with 08 (Ireland) or 07 (UK)";
  }
  return "Irish 08… (10 digits) or UK 07… (11 digits)";
}

export function formatPhoneInput(input: string): string {
  const digits = digitsOnly(input).slice(0, 15);
  if (digits.startsWith("353")) {
    const local = digits.slice(3, 12);
    if (local.length <= 2) return `+353 ${local}`.trim();
    if (local.length <= 5) return `+353 ${local.slice(0, 2)} ${local.slice(2)}`;
    return `+353 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
  }
  if (digits.startsWith("44")) {
    const local = digits.slice(2, 12);
    if (local.length <= 4) return `+44 ${local}`.trim();
    if (local.length <= 7) return `+44 ${local.slice(0, 4)} ${local.slice(4)}`;
    return `+44 ${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 10)}`.trim();
  }
  if (digits.startsWith("08")) {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  if (digits.startsWith("07")) {
    const d = digits.slice(0, 11);
    if (d.length <= 5) return d;
    if (d.length <= 8) return `${d.slice(0, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  // Still typing a leading 0…
  if (digits === "0") return "0";
  return digits.length ? digits : input.replace(/[^\d+\s]/g, "");
}

export function normalizePhone(input: string): string {
  const digits = digitsOnly(input);
  if (digits.startsWith("353") && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("44") && digits.length >= 12) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("08") && digits.length === 10) return `+353${digits.slice(1)}`;
  if (digits.startsWith("8") && digits.length === 9) return `+353${digits}`;
  if (digits.startsWith("07") && digits.length === 11) return `+44${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 10) return `+44${digits}`;
  return input.trim();
}

export function isValidPhone(input: string): boolean {
  const digits = digitsOnly(input);
  // Ireland mobile: 08X XXX XXXX → +353 8X XXX XXXX
  if (digits.startsWith("3538") && digits.length === 12) return true;
  if (digits.startsWith("08") && digits.length === 10) return true;
  if (digits.startsWith("8") && digits.length === 9) return true;
  // UK mobile: 07XXX XXX XXX → +44 7XXX XXX XXX
  if (digits.startsWith("447") && digits.length === 12) return true;
  if (digits.startsWith("07") && digits.length === 11) return true;
  return false;
}

export function phoneValidationError(
  input: string,
  options?: { required?: boolean },
): string | null {
  const required = options?.required !== false;
  const trimmed = input.replace(/\s/g, "");
  if (!trimmed) return required ? "Mobile number is required" : null;
  if (isValidPhone(input)) return null;

  const digits = digitsOnly(input);

  if (digits.startsWith("01") || digits.startsWith("02") || digits.startsWith("03")) {
    return "Enter a mobile number starting with 08 (Ireland) or 07 (UK)";
  }

  if (digits.startsWith("0") && !digits.startsWith("07") && !digits.startsWith("08")) {
    return "Mobile must start with 08 (Ireland, 10 digits) or 07 (UK, 11 digits)";
  }

  if (digits.startsWith("08") || digits.startsWith("3538")) {
    const count = phoneDigitCount(input);
    if (count < 10) return `Irish mobiles are 10 digits starting with 08 (${count}/10)`;
    if (count > 10) return "Irish mobiles are 10 digits starting with 08";
  }

  if (digits.startsWith("07") || digits.startsWith("447") || digits.startsWith("44")) {
    const count = phoneDigitCount(input);
    if (count < 11) return `UK mobiles are 11 digits starting with 07 (${count}/11)`;
    if (count > 11) return "UK mobiles are 11 digits starting with 07";
  }

  if (digits.length > 0 && !digits.startsWith("0") && !digits.startsWith("353") && !digits.startsWith("44") && !digits.startsWith("8") && !digits.startsWith("7")) {
    return "Mobile must start with 08 (Ireland) or 07 (UK)";
  }

  return "Enter a valid mobile: 08… (Ireland, 10 digits) or 07… (UK, 11 digits)";
}
