#!/usr/bin/env npx tsx
/**
 * Booked Consult healthcare vertical audit.
 *
 * Run: VERTICAL=healthcare NEXT_PUBLIC_VERTICAL=healthcare npm run healthcare:audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  HEALTHCARE_BANNED_PATTERNS,
  HEALTHCARE_LP_FILES,
} from "../src/lib/healthcare-compliance";
import {
  brandName,
  crmFileStoreName,
  crmKvKeyName,
  getVertical,
  isHealthcare,
} from "../src/lib/vertical-config";
import { HEALTHCARE_NAV_SECTIONS } from "../src/components/workspace/shell-nav";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Result = { ok: boolean; label: string; detail?: string };
const results: Result[] = [];

function check(ok: boolean, label: string, detail?: string) {
  results.push({ ok, label, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function scanHealthcareCopy() {
  for (const file of HEALTHCARE_LP_FILES) {
    const content = read(file);
    const lines = content.split("\n");
    for (const { label, pattern } of HEALTHCARE_BANNED_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (!pattern.test(line)) continue;
        check(false, `${file}: banned ${label}`, `line ${i + 1}`);
      }
    }
  }
}

function main() {
  console.log("\nHealthcare vertical audit\n");

  process.env.VERTICAL = "healthcare";
  process.env.NEXT_PUBLIC_VERTICAL = "healthcare";

  check(isHealthcare(), "VERTICAL=healthcare activates healthcare mode");
  check(getVertical() === "healthcare", "getVertical() returns healthcare");
  check(brandName() === "Booked Consult", "brandName() is Booked Consult");
  check(crmFileStoreName() === ".booked-consult-crm.json", "CRM file store is booked-consult");
  check(crmKvKeyName() === "booked-consult:crm", "CRM KV key is booked-consult:crm");

  for (const file of HEALTHCARE_LP_FILES) {
    check(existsSync(join(root, file)), `LP file exists: ${file}`);
  }

  scanHealthcareCopy();

  const home = read("src/app/page.tsx");
  check(home.includes('redirect("/for-clinics")'), "Healthcare home redirects to /for-clinics");

  const leadsRoute = read("src/app/api/leads/route.ts");
  check(leadsRoute.includes("handleHealthcareLeadPost"), "Leads API wires healthcare handler");

  check(
    existsSync(join(root, "src/lib/booking-intent-chase.ts")),
    "Booking-intent chase module exists",
  );
  const bookingIntent = read("src/app/api/leads/booking-intent/route.ts");
  check(
    bookingIntent.includes("chaseBookingIntent") && bookingIntent.includes("isHealthcare()"),
    "Booking-intent route triggers healthcare chase",
  );

  check(HEALTHCARE_NAV_SECTIONS.length >= 2, "Healthcare workspace nav sections defined");
  check(
    !HEALTHCARE_NAV_SECTIONS.flatMap((s) => s.items).some((i) => i.href.includes("documents")),
    "Healthcare nav hides document queues",
  );

  const caseWorkflow = read("src/lib/case-workflow.ts");
  check(
    caseWorkflow.includes("isHealthcareVertical()") && caseWorkflow.includes("null"),
    "Case workflow hides document steps for healthcare",
  );

  const envExample = read(".env.example");
  check(envExample.includes("VERTICAL="), ".env.example documents VERTICAL");
  check(envExample.includes("bookedconsult.com"), ".env.example documents Booked Consult URL");

  const forClinicsPage = read("src/components/landing/for-clinics-page.tsx");
  check(forClinicsPage.includes("ForClinicsHero"), "For-clinics page uses navy hero");
  check(forClinicsPage.includes("ForClinicsComparison"), "For-clinics page includes comparison table");
  check(forClinicsPage.includes("ForClinicsFaq"), "For-clinics page includes accordion FAQ");

  const forClinicsCopy = read("src/lib/healthcare-lp-copy.ts");
  check(forClinicsCopy.includes("Who owns the ad account?"), "B2B FAQ includes 7 objection items");

  const implantsPage = read("src/components/landing/healthcare-landing-page.tsx");
  check(implantsPage.includes("HealthcareImplantsFaq"), "Implants LP uses accordion FAQ");
  check(implantsPage.includes("HealthcarePatientComplianceStrip"), "Implants LP has compliance strip");
  check(
    read("src/lib/healthcare-lp-copy.ts").includes("How long is the consultation"),
    "Implants FAQ has 6+ items",
  );

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${failed.length === 0 ? "PASS" : "FAIL"} — ${results.length - failed.length}/${results.length} checks\n`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
