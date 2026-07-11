import { runtimeEnv } from "@/lib/runtime-env";

export type Vertical = "bridging" | "healthcare" | "neuronourish";

/** Server-side vertical (Vercel env per project). Defaults to NeuroNourish. */
export function getVertical(): Vertical {
  const v = runtimeEnv("VERTICAL")?.toLowerCase();
  if (v === "healthcare") return "healthcare";
  if (v === "bridging") return "bridging";
  if (v === "neuronourish") return "neuronourish";
  return "neuronourish";
}

export function isBridging(): boolean {
  return getVertical() === "bridging";
}

export function isHealthcare(): boolean {
  return getVertical() === "healthcare";
}

export function isNeuronourish(): boolean {
  return getVertical() === "neuronourish";
}

/** Client + server — set NEXT_PUBLIC_VERTICAL on each Vercel project. */
export function getPublicVertical(): Vertical {
  const pub = runtimeEnv("NEXT_PUBLIC_VERTICAL")?.toLowerCase();
  if (pub === "healthcare") return "healthcare";
  if (pub === "bridging") return "bridging";
  if (pub === "neuronourish") return "neuronourish";
  return getVertical();
}

export function isHealthcareVertical(): boolean {
  return getPublicVertical() === "healthcare";
}

export function isNeuronourishVertical(): boolean {
  return getPublicVertical() === "neuronourish";
}

export function isClinicVertical(): boolean {
  return isHealthcareVertical() || isNeuronourishVertical();
}

export function brandName(): string {
  const custom = runtimeEnv("BRAND_NAME");
  if (custom) return custom;
  if (isNeuronourish()) return "NeuroNourish Clinic";
  if (isHealthcare()) return "Booked Consult";
  return "NeuroNourish Clinic";
}

export function partnerDisplayName(): string {
  return runtimeEnv("PARTNER_NAME")?.trim() || brandName();
}

export function partnerNotifyEmail(): string {
  return (
    runtimeEnv("PARTNER_NOTIFY_EMAIL")?.trim() ||
    runtimeEnv("BROKER_NOTIFY_EMAIL")?.trim() ||
    "hello@neuronourish.clinic"
  );
}

export function partnerNotifyPhone(): string {
  return (
    runtimeEnv("PARTNER_NOTIFY_PHONE")?.trim() ||
    runtimeEnv("BROKER_NOTIFY_PHONE")?.trim() ||
    "+447445160345"
  );
}

export function crmFileStoreName(): string {
  return (
    runtimeEnv("CRM_FILE_STORE") ||
    (isNeuronourish()
      ? ".neuronourish-crm.json"
      : isHealthcare()
        ? ".booked-consult-crm.json"
        : ".blb-crm.json")
  );
}

export function crmKvKeyName(): string {
  return (
    runtimeEnv("CRM_KV_KEY") ||
    (isNeuronourish()
      ? "neuronourish:crm"
      : isHealthcare()
        ? "booked-consult:crm"
        : "bridging-loans-broker:crm")
  );
}

export function defaultCaseOwner(): string {
  if (isNeuronourish()) {
    return runtimeEnv("PARTNER_NAME")?.trim() || "Emer";
  }
  if (isHealthcare()) {
    return runtimeEnv("PARTNER_NAME")?.trim() || "Clinic";
  }
  return runtimeEnv("DEFAULT_CASE_OWNER")?.trim() || "Daniel";
}

export function publicPartnerDisplayName(): string {
  return (
    runtimeEnv("NEXT_PUBLIC_PARTNER_NAME")?.trim() ||
    runtimeEnv("NEXT_PUBLIC_BRAND_NAME")?.trim() ||
    (isHealthcareVertical() ? "Booked Consult" : "NeuroNourish Clinic")
  );
}

export function partnerCity(): string {
  return runtimeEnv("NEXT_PUBLIC_PARTNER_CITY")?.trim() || "London";
}

/** Booked Consult routes (/for-clinics, /lp/implants) — always BC branding. */
export function bookedConsultBrandName(): string {
  const custom = runtimeEnv("BRAND_NAME")?.trim();
  if (custom && !/bridging\s+loans/i.test(custom)) return custom;
  return "Booked Consult";
}

/** Clinic name on patient LPs — never falls back to another vertical's brand. */
export function healthcareClinicPublicName(): string {
  const name =
    runtimeEnv("NEXT_PUBLIC_PARTNER_NAME")?.trim() ||
    runtimeEnv("PARTNER_NAME")?.trim();
  if (name && !/bridging\s+loans/i.test(name)) return name;
  return "Private implant clinic";
}

export function healthcarePublicPartnerDisplayName(): string {
  return healthcareClinicPublicName();
}
