/** ASA/GDC-safe copy rules for healthcare LPs — used by healthcare-vertical-audit.ts */

export const HEALTHCARE_BANNED_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "guaranteed results", pattern: /\bguaranteed?\s+(results|outcome|success)\b/i },
  { label: "pain-free forever", pattern: /\bpain[\s-]?free\s+forever\b/i },
  { label: "best dentist", pattern: /\bbest\s+dentist\b/i },
  { label: "FCA regulated", pattern: /\bFCA\b/i },
  { label: "bridging loan", pattern: /\bbridging\s+loan\b/i },
  { label: "primary residence", pattern: /\bprimary\s+residence\b/i },
];

export const HEALTHCARE_LP_FILES = [
  "src/lib/healthcare-lp-copy.ts",
  "src/components/landing/healthcare-landing-page.tsx",
  "src/components/landing/healthcare-implants-faq.tsx",
  "src/components/landing/healthcare-patient-compliance-strip.tsx",
  "src/components/landing/for-clinics-page.tsx",
  "src/components/forms/healthcare-lead-form.tsx",
  "src/components/forms/healthcare-thank-you.tsx",
  "src/app/for-clinics/page.tsx",
  "src/app/lp/implants/page.tsx",
] as const;
