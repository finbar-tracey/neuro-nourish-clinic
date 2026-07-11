/** Vonage expects international numbers without a leading + (e.g. 447700900000). */
export function toVonageNumber(phone: string): string {
  const normalized = phone.replace(/\s/g, "");
  if (normalized.startsWith("+")) return normalized.slice(1);
  if (normalized.startsWith("00")) return normalized.slice(2);
  if (normalized.startsWith("353")) return normalized;
  if (normalized.startsWith("44")) return normalized;

  // Irish mobile 08xxxxxxxx (9 digits after 0)
  if (/^08\d{8}$/.test(normalized)) {
    return `353${normalized.slice(1)}`;
  }

  // UK mobile 07xxxxxxxxx
  if (/^07\d{9}$/.test(normalized)) {
    return `44${normalized.slice(1)}`;
  }

  // Other leading 0 — default UK (broker is UK-focused)
  if (normalized.startsWith("0")) {
    return `44${normalized.slice(1)}`;
  }

  return normalized;
}

export function isIrishNumber(phone: string): boolean {
  const n = toVonageNumber(phone);
  return n.startsWith("353");
}

/** Keep SMS in GSM-7 to avoid multi-segment Unicode charges. */
export function gsmSafeSms(text: string): string {
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\n\r\t\x20-\x7E]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
