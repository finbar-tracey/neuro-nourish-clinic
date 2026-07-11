import {
  isValidUKPhone,
  normalizeUKPhone,
  ukPhoneValidationError,
} from "@/lib/form-validation";
import { isValidPhone, normalizePhone, phoneValidationError } from "@/lib/phone-ie";
import { z } from "zod";

const ukMobilePhoneSchema = z
  .string()
  .min(1, "Mobile number is required")
  .superRefine((value, ctx) => {
    if (!isValidUKPhone(value)) {
      ctx.addIssue({
        code: "custom",
        message: ukPhoneValidationError(value) ?? "Enter a valid UK mobile number",
      });
    }
  })
  .transform((value) => normalizeUKPhone(value));

const optionalString = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().optional(),
);

const trackingFields = {
  source: optionalString,
  utmSource: optionalString,
  utmMedium: optionalString,
  utmCampaign: optionalString,
  utmContent: optionalString,
  utmTerm: optionalString,
  fbclid: optionalString,
  gclid: optionalString,
  landingPageUrl: optionalString,
  referrer: optionalString,
  deviceType: optionalString,
  /** Facebook ad angle slug (auction, chain_break, etc.) */
  adAngle: optionalString,
  /** Shared event_id for browser pixel + Conversions API deduplication */
  metaEventId: optionalString,
  fbp: optionalString,
  fbc: optionalString,
  /** HMAC token for Meta /lp/complete submissions */
  completionToken: optionalString,
};

/** Step 2 — contact captured in CRM before qualification step */
export const contactCaptureSchema = z.object({
  stage: z.literal("capture"),
  leadId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: ukMobilePhoneSchema,
  loanPurpose: z.string().min(1, "Please select a loan purpose"),
  loanAmount: z.coerce.number().min(50000, "Minimum loan amount is £50,000"),
  timeframe: z.string().min(1, "Please select a timeframe"),
  consent: z.literal(true, {
    message: "You must agree to be contacted",
  }),
  ...trackingFields,
});

export const leadFormSchema = z.object({
  stage: z.literal("complete").optional(),
  leadId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: ukMobilePhoneSchema,
  loanPurpose: z.string().min(1, "Please select a loan purpose"),
  loanAmount: z.coerce.number().min(50000, "Minimum loan amount is £50,000"),
  termMonths: z.coerce.number().min(1).max(36),
  propertyType: z.string().min(1, "Please select a property type"),
  propertyValue: z.coerce.number().min(50000, "Property value is required"),
  propertyLocation: z.string().min(2, "Property location is required"),
  ltv: z.string().optional(),
  timeframe: z.string().min(1, "Please select a timeframe"),
  hasExistingMortgage: z.coerce.boolean(),
  willOccupy: z.coerce.boolean(),
  hasEverOccupied: z.coerce.boolean(),
  additionalInfo: z.string().optional(),
  consent: z.literal(true, {
    message: "You must agree to be contacted",
  }),
  ...trackingFields,
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
export type ContactCaptureData = z.infer<typeof contactCaptureSchema>;

/** Booked Consult — implant patient funnel (healthcare vertical). */
export const healthcareLeadSchema = z.object({
  vertical: z.literal("healthcare"),
  stage: z.literal("complete"),
  leadId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: ukMobilePhoneSchema,
  treatmentType: z.string().min(1, "Please select a treatment type"),
  timeline: z.string().min(1, "Please select a timeline"),
  postcode: z.string().min(4, "Postcode is required"),
  budgetBand: z.string().min(1, "Please select a budget band"),
  consent: z.literal(true, {
    message: "You must agree to be contacted",
  }),
  ...trackingFields,
});

export type HealthcareLeadData = z.infer<typeof healthcareLeadSchema>;

const ieUkPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .superRefine((value, ctx) => {
    if (!isValidPhone(value)) {
      ctx.addIssue({
        code: "custom",
        message: phoneValidationError(value) ?? "Enter a valid Irish or UK mobile number",
      });
    }
  })
  .transform((value) => normalizePhone(value));

/** Soft mid-quiz capture — phone collected later on results. */
const optionalIeUkPhoneSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed ? normalizePhone(trimmed) : "";
  })
  .superRefine((value, ctx) => {
    if (value && !isValidPhone(value)) {
      ctx.addIssue({
        code: "custom",
        message: phoneValidationError(value, { required: false }) ?? "Enter a valid Irish or UK mobile number",
      });
    }
  });

/** NeuroNourish — consumer funnel events */
export const funnelLeadSchema = z.discriminatedUnion("funnelStage", [
  z.object({
    vertical: z.literal("neuronourish"),
    funnelStage: z.literal("quiz_started"),
    leadId: z.string().optional(),
    ...trackingFields,
  }),
  z.object({
    vertical: z.literal("neuronourish"),
    funnelStage: z.literal("quiz_partial"),
    leadId: z.string().optional(),
    firstName: z.string().min(1),
    lastName: z.string().optional().default(""),
    email: z.string().email(),
    phone: optionalIeUkPhoneSchema,
    consent: z.literal(true),
    quizProgress: z.number().optional(),
    ...trackingFields,
  }),
  z.object({
    vertical: z.literal("neuronourish"),
    funnelStage: z.literal("quiz_completed"),
    leadId: z.string().min(1),
    quizScore: z.number().min(0).max(100),
    quizAnswers: z.record(z.string(), z.number()).optional(),
    segment: z.string().optional(),
    archetypeKey: z.string().optional(),
    archetypeName: z.string().optional(),
    ...trackingFields,
  }),
  z.object({
    vertical: z.literal("neuronourish"),
    funnelStage: z.literal("quiz_report_request"),
    leadId: z.string().min(1),
    phone: optionalIeUkPhoneSchema,
    consent: z.boolean().optional(),
    ...trackingFields,
  }),
  z.object({
    vertical: z.literal("neuronourish"),
    funnelStage: z.enum([
      "eoi_submitted",
      "discovery_requested",
      "assessment_offered",
      "assessment_purchased",
      "programme_offered",
    ]),
    leadId: z.string().optional(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: ieUkPhoneSchema,
    primaryConcern: z.string().optional(),
    message: z.string().optional(),
    clinicName: z.string().optional(),
    consent: z.literal(true),
    segment: z.string().optional(),
    ...trackingFields,
  }),
]);

export type FunnelLeadData = z.infer<typeof funnelLeadSchema>;

/** NeuroNourish — expression of interest / contact (alias) */
export const waitlistLeadSchema = z.object({
  vertical: z.literal("neuronourish"),
  stage: z.literal("complete"),
  funnelStage: z.literal("eoi_submitted").optional(),
  leadId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: ieUkPhoneSchema,
  primaryConcern: z.string().min(1, "Please select your primary concern"),
  clinicName: z.string().optional(),
  ageRange: z.string().optional(),
  message: z.string().optional(),
  consent: z.literal(true, {
    message: "You must agree to be contacted",
  }),
  segment: z.string().optional(),
  ...trackingFields,
});

export type WaitlistLeadData = z.infer<typeof waitlistLeadSchema>;

export const LOAN_PURPOSES = [
  { value: "auction", label: "Auction Purchase" },
  { value: "purchase", label: "Property Purchase" },
  { value: "equity_release", label: "Capital Raise" },
  { value: "chain_break", label: "Business/Investment" },
  { value: "refinance", label: "Refinance" },
  { value: "refurbishment", label: "Refurb" },
  { value: "development", label: "Development" },
  { value: "other", label: "Other" },
] as const;

export const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "hmo", label: "HMO" },
  { value: "land", label: "Land" },
  { value: "development", label: "Development Site" },
] as const;

export { TIMEFRAMES } from "@/lib/timeframes";

export const TERM_OPTIONS = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
  { value: 24, label: "24 months" },
  { value: 36, label: "36 months" },
] as const;
