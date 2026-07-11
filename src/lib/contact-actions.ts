/** One-tap contact links for Daniel's inbox — no copy/paste */

import { normalizeUKPhone } from "@/lib/form-validation";
import { gsmSafeSms } from "@/lib/sms-encoding";

function contactDigits(phone: string): string {
  const compact = phone.replace(/\s/g, "");
  if (compact.startsWith("+447") && compact.length === 13) {
    return compact.slice(1);
  }
  try {
    return normalizeUKPhone(phone).slice(1);
  } catch {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("44")) return digits;
    if (digits.startsWith("0")) return `44${digits.slice(1)}`;
    return digits;
  }
}

export function telLink(phone: string): string {
  const digits = contactDigits(phone);
  return digits ? `tel:+${digits}` : `tel:${phone.replace(/\s/g, "")}`;
}

export function smsLink(phone: string, body?: string): string {
  const e164 = contactDigits(phone);
  const base = `sms:+${e164}`;
  return body ? `${base}?body=${encodeURIComponent(body)}` : base;
}

export function mailtoLink(email: string, subject?: string): string {
  const base = `mailto:${email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

export function whatsappLink(phone: string, message?: string): string {
  const e164 = contactDigits(phone);
  const base = `https://wa.me/${e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function defaultSmsBody(firstName: string): string {
  return gsmSafeSms(
    `Hi ${firstName}, Daniel at BLB here. I received your enquiry - when is a good time for a quick call?`,
  );
}

export function defaultEmailSubject(firstName: string): string {
  return `Your bridging finance enquiry — ${firstName}`;
}
