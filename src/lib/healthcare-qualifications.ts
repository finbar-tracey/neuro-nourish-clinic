import { runtimeEnv } from "@/lib/runtime-env";

export type HealthcareDisqualifyCode = "timeline" | "postcode" | "catchment";

export type HealthcareDisqualifyResult = {
  qualified: false;
  code: HealthcareDisqualifyCode;
  title: string;
  message: string;
  nurtureEnrolled?: boolean;
};

export type HealthcareQualificationResult =
  | { qualified: true }
  | HealthcareDisqualifyResult;

/** Basic UK postcode shape — clinic sets radius in pilot; v1 logs all UK postcodes. */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function normalizePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Comma-separated outward prefixes, e.g. SW,SE,NW,EC — empty = all UK postcodes allowed */
export function healthcarePostcodePrefixes(): string[] {
  const raw = runtimeEnv("HEALTHCARE_POSTCODE_PREFIXES");
  if (!raw) return [];
  return raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
}

export function checkHealthcareQualification(data: {
  postcode: string;
  timeline: string;
}): HealthcareQualificationResult {
  const postcode = normalizePostcode(data.postcode);
  if (!UK_POSTCODE.test(postcode)) {
    return {
      qualified: false,
      code: "postcode",
      title: "Enter a valid UK postcode",
      message: "Please enter a valid UK postcode so we can match you with the clinic.",
    };
  }

  const prefixes = healthcarePostcodePrefixes();
  if (prefixes.length > 0) {
    const outward = (postcode.split(" ")[0] ?? postcode).toUpperCase();
    const inArea = prefixes.some((prefix) => outward.startsWith(prefix));
    if (!inArea) {
      return {
        qualified: false,
        code: "catchment",
        nurtureEnrolled: true,
        title: "Outside the clinic area",
        message:
          "This clinic's free implant consultations are currently available for patients in their local area. We've saved your details in case availability expands.",
      };
    }
  }

  if (data.timeline === "researching") {
    return {
      qualified: false,
      code: "timeline",
      nurtureEnrolled: true,
      title: "Still researching?",
      message:
        "Implant treatment works best when you're ready within the next few months. We've saved your details — we'll send helpful information while you decide.",
    };
  }

  return { qualified: true };
}

export function treatmentLabel(value: string): string {
  const labels: Record<string, string> = {
    single_implant: "Single implant",
    multiple_implants: "Multiple implants",
    full_arch: "Full arch / All-on-4",
    unsure: "Implant advice",
  };
  return labels[value] ?? value;
}

export function timelineLabel(value: string): string {
  const labels: Record<string, string> = {
    within_3_months: "Within 3 months",
    "3_to_6_months": "3–6 months",
    researching: "Researching",
  };
  return labels[value] ?? value;
}
