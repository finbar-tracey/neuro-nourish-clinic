#!/usr/bin/env npx tsx
/**
 * End-to-end form flow audit (API + validation).
 * Run: npm run form:e2e
 */
import { config } from "dotenv";
config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { db } from "../src/lib/db";
import { parseFormUrlParams } from "../src/lib/form-validation";
import { checkLeadQualification } from "../src/lib/qualifications";
import { isLongTimeframe } from "../src/lib/timeframes";

const TEST_EMAIL = "form-audit@test.local";

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function main() {
  assert("URL amount prefill", parseFormUrlParams("?amount=250000").loanAmount === 250000);
  assert("URL rejects sub-min", parseFormUrlParams("?amount=30000").loanAmount === undefined);
  assert("Qualify £250k investor", checkLeadQualification({
    loanAmount: 250000,
    willOccupy: false,
    hasEverOccupied: false,
  }).qualified === true);
  assert("Disqualify occupancy", checkLeadQualification({
    loanAmount: 250000,
    willOccupy: true,
    hasEverOccupied: false,
  }).qualified === false);
  assert("Nurture timeframe", isLongTimeframe("researching"));

  let captureId: string | undefined;

  try {
    const capture = await db.lead.create({
      data: {
        firstName: "Form",
        lastName: "Audit",
        email: TEST_EMAIL,
        phone: "07123456789",
        loanPurpose: "auction",
        loanAmount: 250000,
        termMonths: 12,
        propertyType: "pending",
        propertyValue: 250000,
        propertyLocation: "Not yet provided",
        timeframe: "30_days",
        formCompleted: false,
        qualificationTier: "partial",
        status: "NEW",
        source: "form_e2e_audit",
      },
    });
    captureId = capture.id;
    assert("Step 2 capture (partial lead)", true, capture.id);

    const complete = await db.lead.update({
      where: { id: capture.id },
      data: {
        formCompleted: true,
        qualificationTier: "fully_qualified",
        propertyType: "residential",
        propertyLocation: "London",
        propertyValue: 350000,
        status: "NEW",
      },
    });
    assert("Step 3 complete", complete.formCompleted === true);

    const nurture = await db.lead.create({
      data: {
        firstName: "Nurture",
        lastName: "Audit",
        email: "nurture-audit@test.local",
        phone: "07987654321",
        loanPurpose: "purchase",
        loanAmount: 300000,
        termMonths: 12,
        propertyType: "unspecified",
        propertyValue: 300000,
        propertyLocation: "Still researching",
        timeframe: "researching",
        formCompleted: true,
        nurtureEnrolled: true,
        status: "FOLLOW_UP",
        source: "form_e2e_audit",
      },
    });
    assert("Nurture path → FOLLOW_UP", nurture.status === "FOLLOW_UP", nurture.id);

    await db.lead.delete({ where: { id: nurture.id } });
  } catch (error) {
    assert("DB form flows", false, error instanceof Error ? error.message : "Failed");
  } finally {
    if (captureId) {
      await db.lead.delete({ where: { id: captureId } }).catch(() => {});
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\n📋 Form E2E audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
