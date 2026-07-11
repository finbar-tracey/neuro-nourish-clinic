import { runtimeEnv } from "@/lib/runtime-env";

export type ClinicTestimonial = {
  name: string;
  role: string;
  quote: string;
  photoUrl?: string;
};

export function salesContactEmailDisplay(): string {
  return salesContactEmail() ?? "hello@bookedconsult.com";
}

export function hasSalesCalendlyEmbed(): boolean {
  const url =
    runtimeEnv("NEXT_PUBLIC_SALES_CALENDLY_URL")?.trim() ||
    runtimeEnv("NEXT_PUBLIC_CALENDLY_URL")?.trim();
  return !!url;
}

export function salesBookingHref(): string {
  const url =
    runtimeEnv("NEXT_PUBLIC_SALES_CALENDLY_URL")?.trim() ||
    runtimeEnv("NEXT_PUBLIC_CALENDLY_URL")?.trim();
  if (url) return url;
  const email = salesContactEmailDisplay();
  return `mailto:${email}?subject=${encodeURIComponent("Booked Consult — 10-minute pilot call")}`;
}

export function salesCalendlyUrl(): string {
  const url =
    runtimeEnv("NEXT_PUBLIC_SALES_CALENDLY_URL")?.trim() ||
    runtimeEnv("NEXT_PUBLIC_CALENDLY_URL")?.trim();
  return url || "#faq";
}

export function pilotLoomUrl(): string {
  return runtimeEnv("NEXT_PUBLIC_PILOT_LOOM_URL") ?? "";
}

export function salesContactEmail(): string | null {
  return (
    runtimeEnv("SALES_EMAIL")?.trim() ||
    runtimeEnv("PARTNER_NOTIFY_EMAIL")?.trim() ||
    null
  );
}

export const CRM_WORKSPACE_IMAGE_WEBP = "/images/for-clinics/crm-workspace.webp";
export const CRM_WORKSPACE_IMAGE_PNG = "/images/for-clinics/crm-workspace.png";
/** Prefer WebP; PNG fallback from asset generator. */
export const CRM_WORKSPACE_IMAGE = CRM_WORKSPACE_IMAGE_WEBP;

export function clinicTestimonialFromEnv(): ClinicTestimonial | null {
  const name = runtimeEnv("NEXT_PUBLIC_CLINIC_TESTIMONIAL_NAME")?.trim();
  const quote = runtimeEnv("NEXT_PUBLIC_CLINIC_TESTIMONIAL_QUOTE")?.trim();
  if (!name || !quote) return null;

  return {
    name,
    quote,
    role:
      runtimeEnv("NEXT_PUBLIC_CLINIC_TESTIMONIAL_ROLE")?.trim() ||
      "Principal dentist · implant partner",
    photoUrl: runtimeEnv("NEXT_PUBLIC_CLINIC_TESTIMONIAL_PHOTO")?.trim() || undefined,
  };
}
