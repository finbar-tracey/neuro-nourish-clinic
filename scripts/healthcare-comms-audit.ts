#!/usr/bin/env npx tsx
/**
 * Healthcare comms audit — no BLB copy in patient/partner notifications.
 *
 * Run: npm run healthcare:comms-audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  HEALTHCARE_COMMS_BANNED,
  healthcarePartnerAlertSmsBody,
  healthcareQualifiedEmail,
  healthcareQualifiedSmsBody,
} from "../src/lib/healthcare-comms-copy";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Result = { ok: boolean; label: string; detail?: string };
const results: Result[] = [];

function check(ok: boolean, label: string, detail?: string) {
  results.push({ ok, label, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function scanText(label: string, text: string) {
  for (const pattern of HEALTHCARE_COMMS_BANNED) {
    if (pattern.test(text)) {
      check(false, `${label}: banned ${pattern}`, text.slice(0, 80));
      return;
    }
  }
}

function main() {
  console.log("\nHealthcare comms audit\n");

  process.env.VERTICAL = "healthcare";
  process.env.PARTNER_NAME = "Demo Implant Clinic";
  process.env.NEXT_PUBLIC_PARTNER_NAME = "Demo Implant Clinic";

  const sampleLead = {
    id: "audit-lead-id",
    firstName: "Alex",
    lastName: "Demo",
    email: "alex@example.com",
    phone: "07123456789",
    loanPurpose: "single_implant",
    loanAmount: 7500,
    timeframe: "within_3_months",
    propertyLocation: "SW1A 1AA",
    additionalInfo:
      '[Healthcare] Single implant · Within 3 months · SW1A 1AA · {"vertical":"healthcare","treatmentType":"single_implant","timeline":"within_3_months","postcode":"SW1A 1AA","budgetBand":"5k_10k"}',
  };

  const email = healthcareQualifiedEmail(sampleLead as never);
  scanText("Patient SMS", healthcareQualifiedSmsBody(sampleLead as never));
  scanText("Patient email body", email.body);
  scanText("Patient email subject", email.subject);
  check(email.cta.href.includes("audit-lead-id"), "Email CTA includes lead id");

  scanText("Partner SMS", healthcarePartnerAlertSmsBody(sampleLead as never));

  check(
    read("src/lib/healthcare-lead-submit.ts").includes("sendHealthcareQualifiedConfirmation"),
    "healthcare-lead-submit uses healthcare notifications",
  );
  check(
    !read("src/lib/healthcare-lead-submit.ts").includes("sendQualifiedConfirmation"),
    "healthcare-lead-submit does not use BLB qualified confirmation",
  );
  check(read("src/lib/email-templates.ts").includes("healthcareBrand"), "email template supports healthcare brand");

  const files = [
    "src/lib/healthcare-comms-copy.ts",
    "src/lib/healthcare-notifications.ts",
    "src/components/forms/healthcare-thank-you.tsx",
  ];
  for (const file of files) {
    check(readFileSync(join(root, file), "utf8").length > 0, `File exists: ${file}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${failed.length === 0 ? "PASS" : "FAIL"} — ${results.length - failed.length}/${results.length}\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
