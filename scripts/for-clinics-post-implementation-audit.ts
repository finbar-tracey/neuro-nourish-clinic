#!/usr/bin/env npx tsx
/**
 * Booked Consult — unified healthcare ads post-implementation audit (10/10 gate).
 * Covers /for-clinics (B2B) + /lp/implants (Meta ads destination).
 *
 * Full agent prompt: docs/HEALTHCARE_ADS_POST_IMPLEMENTATION.md
 * Print prompt:      npm run healthcare-ads:prompt
 *
 * STEP 1 — always start here:
 *   npm run dev
 *   LOCAL_POST_IMPL_URL=http://localhost:3000 npm run healthcare-ads:post-implementation
 *
 * After visual review:
 *   FOR_CLINICS_MANUAL_QA_SCORE=9 IMPLANTS_MANUAL_QA_SCORE=9 npm run healthcare-ads:post-implementation
 *
 * After deploy + manual E2E / compliance:
 *   BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
 *   HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com \
 *   HEALTHCARE_GDC_SIGNOFF=true \
 *   HEALTHCARE_AD_LP_LOCK_CONFIRMED=true \
 *   HEALTHCARE_PATIENT_E2E_CONFIRMED=true \
 *   HEALTHCARE_META_EVENTS_CONFIRMED=true \
 *   npm run healthcare-ads:post-implementation
 *
 * Live API cross-contamination (creates test lead — delete in workspace):
 *   HEALTHCARE_POST_AUDIT_LIVE=true BLB_POST_IMPL_URL=... HEALTHCARE_POST_IMPL_URL=... \
 *   npm run healthcare-ads:post-implementation
 */
import { checkHealthcareQualification } from "@/lib/healthcare-qualifications";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import {
  HEALTHCARE_B2B_METADATA,
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_COMPARISON,
  HEALTHCARE_FOR_CLINICS_FAQ,
  HEALTHCARE_IMPLANTS_FAQ,
  HEALTHCARE_IMPLANTS_HERO,
  HEALTHCARE_PATIENT_COMPLIANCE_STRIP,
} from "@/lib/healthcare-lp-copy";
import { META_LP_METADATA } from "@/lib/meta-lp-copy";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  phase: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
  skipped?: boolean;
};

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const checks: Check[] = [];

const FOR_CLINICS_COMPONENTS = [
  "src/components/landing/for-clinics-page.tsx",
  "src/components/landing/for-clinics-hero.tsx",
  "src/components/landing/for-clinics-header.tsx",
  "src/components/landing/for-clinics-comparison.tsx",
  "src/components/landing/for-clinics-crm-section.tsx",
  "src/components/landing/for-clinics-faq.tsx",
  "src/components/landing/for-clinics-pilot-offer.tsx",
  "src/components/landing/for-clinics-how-it-works.tsx",
  "src/components/landing/for-clinics-guarantee.tsx",
  "src/components/landing/for-clinics-operator.tsx",
  "src/components/landing/for-clinics-footer.tsx",
  "src/components/landing/for-clinics-proof.tsx",
  "src/components/landing/sales-calendly-embed.tsx",
  "src/lib/for-clinics-config.ts",
] as const;

const IMPLANTS_LP_COMPONENTS = [
  "src/components/landing/healthcare-landing-page.tsx",
  "src/components/landing/healthcare-implants-header.tsx",
  "src/components/landing/healthcare-patient-compliance-strip.tsx",
  "src/components/landing/healthcare-implants-steps.tsx",
  "src/components/landing/healthcare-implants-mid-cta.tsx",
  "src/components/landing/healthcare-implants-faq.tsx",
  "src/components/landing/healthcare-implants-footer.tsx",
  "src/components/forms/healthcare-thank-you.tsx",
] as const;

function check(
  id: string,
  phase: string,
  pass: boolean,
  detail?: string,
  severity: Severity = "P0",
  skipped = false,
) {
  checks.push({ id, phase, pass, detail, severity, skipped });
  const icon = skipped ? "○" : pass ? "✓" : "✗";
  console.log(`${icon} [${phase}] ${id} ${detail ?? ""}`.trimEnd());
}

function runNpm(script: string): { ok: boolean; out: string } {
  try {
    const out = execSync(`npm run ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NOTIFICATIONS_DRY_RUN: "true", META_CAPI_DRY_RUN: "true" },
    });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

async function fetchText(url: string, redirect: RequestRedirect = "follow") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { redirect, signal: controller.signal });
    return { res, html: await res.text(), finalUrl: res.url, ok: true as const };
  } catch (err) {
    return { ok: false as const, error: String(err), html: "", finalUrl: url, res: null };
  } finally {
    clearTimeout(timer);
  }
}

function htmlHasBlb(html: string): boolean {
  return html.includes("Bridging Loans Broker");
}

function manualFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

const P0_TRIAGE: Record<string, string> = {
  "P3-02": "BLB on /for-clinics → vertical-config.ts bookedConsultBrandName()",
  "P3-03": "BLB on /lp/implants → healthcareClinicPublicName()",
  "P3i-07": "FAQ accordion missing → healthcare-landing-page.tsx HealthcareImplantsFaq",
  "P2b-04": "Inline Calendly → healthcare-thank-you.tsx + NEXT_PUBLIC_CALENDLY_URL",
  "P6b-11": "Live BLB leak on implants → redeploy Project B with healthcare env",
  "M01": "Set HEALTHCARE_GDC_SIGNOFF=true after GDC/ASA + clinic ad approval on file",
  "M02": "Set HEALTHCARE_AD_LP_LOCK_CONFIRMED=true after ad ↔ LP sign-off",
  "M03": "Set HEALTHCARE_PATIENT_E2E_CONFIRMED=true after live form → Calendly → workspace",
  "M04": "Set HEALTHCARE_META_EVENTS_CONFIRMED=true after Meta Test Events verified",
  "P7-01": "Cross-KV leak → separate KV_REST_API_* on Project B",
};

function printStep1Guide() {
  console.log("\n── Step 1 guide (automated vs manual) ──\n");
  console.log("Full 10/10 prompt: docs/HEALTHCARE_ADS_POST_IMPLEMENTATION.md");
  console.log("Print agent prompt: npm run healthcare-ads:prompt\n");
  console.log("Automated by this script: vertical:protect, build, static wiring, local/live HTML, qualification tests");
  console.log("Manual (confirm via env after you verify):");
  console.log("  FOR_CLINICS_MANUAL_QA_SCORE / IMPLANTS_MANUAL_QA_SCORE");
  console.log("  HEALTHCARE_GDC_SIGNOFF / HEALTHCARE_AD_LP_LOCK_CONFIRMED");
  console.log("  HEALTHCARE_PATIENT_E2E_CONFIRMED / HEALTHCARE_META_EVENTS_CONFIRMED");
  console.log("  HEALTHCARE_CLINIC_CALENDLY_CONFIRMED (P1)");
  console.log("Do not run ad-hoc curl greps if local HTML phases passed.\n");
}

function printEconomicsAndWeek1() {
  console.log("\n── Economics & week 1 cadence (reference) ──\n");
  console.log("Test budget: £20–50/day · ~£350 max week 1");
  console.log("Pause if: 50 clicks/0 form starts · 20 submits/0 Calendly · 10 Calendly opens/0 bookings · DQ >40%");
  console.log("D0: gate PASS + sign-offs · D1: £20/day · D2: drop-off review · D3: booked count · D7: scale/fix/pause\n");
}

function printTriageForP0() {
  const p0 = checks.filter((c) => !c.skipped && !c.pass && c.severity === "P0");
  if (p0.length === 0) return;
  console.log("\n── P0 triage map ──\n");
  for (const f of p0) {
    const hint = P0_TRIAGE[f.id] ?? P0_TRIAGE[f.id.slice(0, 4)] ?? "Re-run gate after fix; see phase detail above";
    console.log(`  ${f.id}: ${hint}`);
  }
  console.log("");
}

function runPreflight() {
  console.log("\n── Phase 0: Preflight ──\n");

  let nodeVersion = "unknown";
  let npmVersion = "unknown";
  try {
    nodeVersion = execSync("node -v", { encoding: "utf8" }).trim();
    npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
  } catch {
    /* ignore */
  }

  check("P0-01", "Preflight", !!nodeVersion, `node ${nodeVersion}`, "P1");
  check("P0-02", "Preflight", !!npmVersion, `npm ${npmVersion}`, "P1");
  check("P0-03", "Preflight", existsSync(join(root, "package.json")), "package.json present");
  check(
    "P0-04",
    "Preflight",
    read("package.json").includes('"for-clinics:post-implementation"') ||
      read("package.json").includes('"healthcare-ads:post-implementation"'),
    "npm script registered",
  );
  check(
    "P0-05",
    "Preflight",
    existsSync(join(root, "docs", "HEALTHCARE_ADS_POST_IMPLEMENTATION.md")),
    "10/10 post-implementation prompt doc present",
    "P1",
  );
  check(
    "P0-06",
    "Preflight",
    read("package.json").includes('"healthcare-ads:prompt"'),
    "healthcare-ads:prompt script registered",
    "P1",
  );
}

function runAutomatedGate() {
  console.log("\n── Phase 1: Automated local gate ──\n");

  const protect = runNpm("vertical:protect");
  check("P1-01", "Automated", protect.ok, protect.ok ? "vertical:protect PASS" : "vertical:protect FAIL");

  const hcPost = runNpm("healthcare:post-implementation");
  check(
    "P1-02",
    "Automated",
    hcPost.ok,
    hcPost.ok ? "healthcare:post-implementation PASS" : "healthcare:post-implementation FAIL",
  );

  const build = runNpm("build");
  check("P1-03", "Automated", build.ok, build.ok ? "build PASS" : "build FAIL");
}

function runStaticForClinics() {
  console.log("\n── Phase 2: Static /for-clinics wiring ──\n");

  for (const file of FOR_CLINICS_COMPONENTS) {
    check("P2-01", "Static", existsSync(join(root, file)), file);
  }

  const page = read("src/components/landing/for-clinics-page.tsx");
  const requiredSections = [
    "ForClinicsHero",
    "ForClinicsComparison",
    "ForClinicsCrmSection",
    "ForClinicsPilotOffer",
    "ForClinicsHowItWorks",
    "ForClinicsGuarantee",
    "ForClinicsOperator",
    "ForClinicsFaq",
    "ForClinicsFooter",
    "MetaViewContent",
  ];
  for (const section of requiredSections) {
    check("P2-02", "Static", page.includes(section), `page composes ${section}`);
  }

  check("P2-03", "Static", page.includes('id="main-content"'), "main landmark");
  check(
    "P2-04",
    "Static",
    HEALTHCARE_FOR_CLINICS_FAQ.length >= 7,
    `FAQ items=${HEALTHCARE_FOR_CLINICS_FAQ.length}`,
  );
  check(
    "P2-05",
    "Static",
    HEALTHCARE_FOR_CLINICS_COMPARISON.rows.length >= 6,
    `comparison rows=${HEALTHCARE_FOR_CLINICS_COMPARISON.rows.length}`,
  );

  const envExample = read(".env.example");
  for (const key of [
    "NEXT_PUBLIC_SALES_CALENDLY_URL",
    "NEXT_PUBLIC_PILOT_LOOM_URL",
    "NEXT_PUBLIC_CALENDLY_URL",
    "SALES_EMAIL",
    "HEALTHCARE_POSTCODE_PREFIXES",
    "bookedconsult.com",
  ]) {
    check("P2-06", "Static", envExample.includes(key), `.env.example documents ${key}`, "P1");
  }
}

function runStaticImplantsLp() {
  console.log("\n── Phase 2b: Static /lp/implants wiring ──\n");

  for (const file of IMPLANTS_LP_COMPONENTS) {
    check("P2b-01", "Implants static", existsSync(join(root, file)), file);
  }

  const page = read("src/components/landing/healthcare-landing-page.tsx");
  const sections = [
    "HealthcareImplantsHeader",
    "HealthcarePatientComplianceStrip",
    "HealthcareImplantsSteps",
    "HealthcareImplantsMidCta",
    "HealthcareImplantsFaq",
    "HealthcareImplantsFooter",
    "HealthcareStickyCta",
  ];
  for (const section of sections) {
    check("P2b-02", "Implants static", page.includes(section), `page composes ${section}`);
  }

  check(
    "P2b-03",
    "Implants static",
    HEALTHCARE_IMPLANTS_FAQ.length >= 6,
    `FAQ items=${HEALTHCARE_IMPLANTS_FAQ.length}`,
  );

  const thankYou = read("src/components/forms/healthcare-thank-you.tsx");
  check(
    "P2b-04",
    "Implants static",
    thankYou.includes("calendly-inline-widget") && thankYou.includes("firstName"),
    "thank-you inline Calendly + prefill",
  );

  const qualifications = read("src/lib/healthcare-qualifications.ts");
  check(
    "P2b-05",
    "Implants static",
    qualifications.includes("HEALTHCARE_POSTCODE_PREFIXES"),
    "postcode catchment env supported",
  );
}

async function runLocalHtmlGates(baseUrl: string) {
  console.log(`\n── Phase 3: Local HTML gates (${baseUrl}) ──\n`);

  if (!baseUrl) {
    check(
      "P3-00",
      "Local HTML",
      true,
      "skipped — start dev server and set LOCAL_POST_IMPL_URL=http://localhost:3000",
      "P1",
      true,
    );
    return;
  }

  const clinics = await fetchText(`${baseUrl}/for-clinics`);
  if (!clinics.ok) {
    check("P3-99", "Local HTML", false, clinics.error ?? "fetch failed");
    return;
  }

  check("P3-01", "Local HTML", clinics.res?.ok === true, `GET /for-clinics → ${clinics.res?.status}`);
  check("P3-02", "Brand grep", !htmlHasBlb(clinics.html), "/for-clinics has zero BLB strings");

  const implants = await fetchText(`${baseUrl}/lp/implants`);
  if (implants.ok && implants.res?.ok) {
    check("P3-03", "Brand grep", !htmlHasBlb(implants.html), "/lp/implants has zero BLB strings");
  } else {
    check("P3-03", "Brand grep", false, "GET /lp/implants failed", "P1");
  }

  const home = await fetchText(`${baseUrl}/`);
  if (home.ok && home.res?.ok) {
    check(
      "P3-04",
      "BLB home",
      htmlHasBlb(home.html),
      "default / still shows BLB when VERTICAL unset",
      "P1",
    );
  } else {
    check("P3-04", "BLB home", true, "skipped — home fetch failed", "P1", true);
  }

  const contentChecks: [string, string][] = [
    ["P3-05", "for-clinics-hero"],
    ["P3-06", "Lead agency"],
    ["P3-07", "Frequently asked"],
    ["P3-08", "Pilot offer"],
    ["P3-09", "Booked Consult"],
    ["P3-10", "hero-pattern"],
    ["P3-11", HEALTHCARE_FOR_CLINICS.headline],
    ["P3-12", HEALTHCARE_FOR_CLINICS.pilotPrice],
  ];
  for (const [id, needle] of contentChecks) {
    check("P3-content", "Local HTML", clinics.html.includes(needle), `${id} contains "${needle}"`);
  }

  check(
    "P3-13",
    "Local HTML",
    clinics.html.includes("<details") || clinics.html.includes("Frequently asked"),
    "FAQ accordion markup",
  );

  if (!implants.ok || !implants.res?.ok) return;

  const implantChecks: [string, string][] = [
    ["P3i-01", "quote-form"],
    ["P3i-02", "hero-pattern"],
    ["P3i-03", HEALTHCARE_IMPLANTS_HERO.highlight],
    ["P3i-04", "Book free consultation"],
    ["P3i-05", HEALTHCARE_PATIENT_COMPLIANCE_STRIP.slice(0, 30)],
    ["P3i-06", "Common questions"],
  ];
  for (const [id, needle] of implantChecks) {
    check("Implants HTML", "Local HTML", implants.html.includes(needle), `${id} contains match`);
  }
  check(
    "P3i-07",
    "Implants HTML",
    implants.html.includes("<details"),
    "FAQ accordion on implants LP",
  );
}

function runQualificationTests() {
  console.log("\n── Phase 3b: Qualification unit tests ──\n");

  const qualified = checkHealthcareQualification({
    postcode: "SW1A 1AA",
    timeline: "within_3_months",
  });
  check("P3b-01", "Qualification", qualified.qualified === true, "SW1A 1AA + within 3 months qualifies");

  const researching = checkHealthcareQualification({
    postcode: "SW1A 1AA",
    timeline: "researching",
  });
  check(
    "P3b-02",
    "Qualification",
    researching.qualified === false && researching.code === "timeline",
    "researching → nurture DQ",
  );

  const invalid = checkHealthcareQualification({
    postcode: "NOTVALID",
    timeline: "within_3_months",
  });
  check(
    "P3b-03",
    "Qualification",
    invalid.qualified === false && invalid.code === "postcode",
    "invalid postcode rejected",
  );

  if (process.env.HEALTHCARE_POSTCODE_PREFIXES?.trim()) {
    const inArea = checkHealthcareQualification({
      postcode: "SW1A 1AA",
      timeline: "within_3_months",
    });
    const outArea = checkHealthcareQualification({
      postcode: "M1 1AE",
      timeline: "within_3_months",
    });
    check("P3b-04", "Qualification", inArea.qualified === true, "SW1A in catchment");
    check(
      "P3b-05",
      "Qualification",
      outArea.qualified === false && outArea.code === "catchment",
      "M1 1AE outside catchment",
    );
  } else {
    check(
      "P3b-04",
      "Qualification",
      true,
      "catchment skipped — set HEALTHCARE_POSTCODE_PREFIXES to test SW vs M1",
      "P1",
      true,
    );
  }
}

function runAdLpLockStatic() {
  console.log("\n── Phase 3c: Ad ↔ LP lock (copy static) ──\n");

  const hero = HEALTHCARE_IMPLANTS_HERO;
  check("P3c-01", "Ad-LP lock", hero.highlight.toLowerCase().includes("implant consultation"), "H1 highlight");
  check(
    "P3c-02",
    "Ad-LP lock",
    hero.bullets.some((b) => /free consultation/i.test(b)),
    "free consultation in hero bullets",
  );
  check(
    "P3c-03",
    "Ad-LP lock",
    HEALTHCARE_PATIENT_COMPLIANCE_STRIP.includes("No obligation"),
    "compliance strip mentions no obligation",
  );
  check(
    "P3c-04",
    "Ad-LP lock",
    HEALTHCARE_IMPLANTS_FAQ.some((f) => /free/i.test(f.a)),
    "FAQ clarifies free initial consult",
  );
}

function runManualQaGate() {
  console.log("\n── Phase 4: Manual visual QA ──\n");

  const scoreRaw = process.env.FOR_CLINICS_MANUAL_QA_SCORE?.trim();
  const score = scoreRaw ? Number.parseInt(scoreRaw, 10) : NaN;

  console.log("Score /for-clinics at 375px and 1440px (1 point each):");
  console.log("  1. Navy hero + For implant clinics eyebrow");
  console.log("  2. Header: Booked Consult + Patient demo + desktop CTA");
  console.log("  3. Calendly embed (desktop) or amber fallback");
  console.log("  4. Loom section always visible");
  console.log("  5. Comparison table with Recommended = Booked Consult");
  console.log("  6. CRM section with caption");
  console.log("  7. Pilot offer included / you-provide checklists");
  console.log("  8. FAQ accordion ≥7 items, first open");
  console.log("  9. Navy footer + Privacy");
  console.log(" 10. Mobile sticky CTA after hero scroll");
  console.log("\nSet: FOR_CLINICS_MANUAL_QA_SCORE=9 npm run for-clinics:post-implementation\n");

  if (!Number.isFinite(score)) {
    check(
      "P4-01",
      "Manual QA",
      true,
      "skipped — set FOR_CLINICS_MANUAL_QA_SCORE=1-10 after manual review",
      "P1",
      true,
    );
    return;
  }

  check("P4-01", "Manual QA", score >= 9, `visual QA score ${score}/10 (need ≥9)`, "P0");
  check("P4-02", "Manual QA", score >= 7, `for-clinics visual QA ${score}/10 (≥7 acceptable with P1)`, "P1");
}

function runImplantsManualQaGate() {
  console.log("\n── Phase 4b: Manual visual QA /lp/implants ──\n");

  const scoreRaw = process.env.IMPLANTS_MANUAL_QA_SCORE?.trim();
  const score = scoreRaw ? Number.parseInt(scoreRaw, 10) : NaN;

  console.log("Score /lp/implants at 375px (1 point each):");
  console.log("  1. Ad headline matches H1 promise");
  console.log("  2. Real clinic name in hero (not Private implant clinic)");
  console.log("  3. Form visible above fold on mobile");
  console.log("  4. Step 1 completable in under 60 seconds");
  console.log("  5. Thank-you Calendly inline on mobile");
  console.log("  6. SMS confirmation mentioned on thank-you");
  console.log("  7. FAQ accordion works");
  console.log("  8. Sticky CTA scrolls to form");
  console.log("  9. Compliance strip visible");
  console.log(" 10. No BLB branding anywhere");
  console.log("\nSet: IMPLANTS_MANUAL_QA_SCORE=9 npm run healthcare-ads:post-implementation\n");

  if (!Number.isFinite(score)) {
    check(
      "P4b-01",
      "Implants QA",
      true,
      "skipped — set IMPLANTS_MANUAL_QA_SCORE=1-10 after manual review",
      "P1",
      true,
    );
    return;
  }

  check("P4b-01", "Implants QA", score >= 9, `implants visual QA ${score}/10 (need ≥9)`, "P0");
  check("P4b-02", "Implants QA", score >= 7, `implants visual QA ${score}/10 (≥7 with P1)`, "P1");
}

function runManualComplianceGates(hcUrl: string) {
  console.log("\n── Phase 9: Manual compliance gates ──\n");

  if (!hcUrl) {
    check(
      "M00",
      "Manual",
      true,
      "skipped — set HEALTHCARE_POST_IMPL_URL for live manual gates",
      "P1",
      true,
    );
    return;
  }

  console.log("GDC/ASA checklist (confirm on file before HEALTHCARE_GDC_SIGNOFF=true):");
  console.log("  · No guaranteed outcomes / best dentist / pain-free forever");
  console.log("  · Free consultation = initial consult only");
  console.log("  · Booked Consult = booking arranger; treatment by clinic clinicians");
  console.log("  · Ad creative approved by clinic responsible person\n");

  const gates: Array<{ id: string; env: string; label: string; severity: Severity }> = [
    { id: "M01", env: "HEALTHCARE_GDC_SIGNOFF", label: "GDC/ASA + clinic ad approval", severity: "P0" },
    { id: "M02", env: "HEALTHCARE_AD_LP_LOCK_CONFIRMED", label: "Ad ↔ LP message lock", severity: "P0" },
    { id: "M03", env: "HEALTHCARE_PATIENT_E2E_CONFIRMED", label: "Live E2E form → Calendly → workspace", severity: "P0" },
    { id: "M04", env: "HEALTHCARE_META_EVENTS_CONFIRMED", label: "Meta Test Events ViewContent/Lead/Schedule", severity: "P0" },
    {
      id: "M05",
      env: "HEALTHCARE_CLINIC_CALENDLY_CONFIRMED",
      label: "Clinic Calendly ≥4 slots/week, 14 days out",
      severity: "P1",
    },
  ];

  for (const gate of gates) {
    const ok = manualFlag(gate.env);
    check(
      gate.id,
      "Manual",
      ok,
      ok ? `${gate.env}=true` : `set ${gate.env}=true after: ${gate.label}`,
      gate.severity,
    );
  }
}

function runEnvChecklist(strict: boolean) {
  console.log("\n── Phase 5: Project B env checklist ──\n");

  if (!strict) {
    check(
      "P5-00",
      "Env",
      true,
      "advisory skipped locally — set HEALTHCARE_POST_IMPL_URL or HEALTHCARE_POST_AUDIT_LIVE for strict env gate",
      "P1",
      true,
    );

    const crmImage = join(root, "public", "images", "for-clinics", "crm-workspace.webp");
    check(
      "P5-crm-image",
      "Env",
      existsSync(crmImage),
      existsSync(crmImage) ? "crm-workspace.webp present" : "missing public/images/for-clinics/crm-workspace.webp",
      "P2",
    );
    const ogImage = join(root, "public", "og", "for-clinics.png");
    check(
      "P5-og-image",
      "Env",
      existsSync(ogImage),
      existsSync(ogImage) ? "og/for-clinics.png present" : "missing public/og/for-clinics.png",
      "P2",
    );
    return;
  }

  const envChecks: Array<{ id: string; pass: boolean; detail: string; severity: Severity }> = [
    {
      id: "VERTICAL",
      pass: process.env.VERTICAL?.toLowerCase() === "healthcare",
      detail: `VERTICAL=${process.env.VERTICAL ?? "unset"}`,
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_VERTICAL",
      pass: process.env.NEXT_PUBLIC_VERTICAL?.toLowerCase() === "healthcare",
      detail: `NEXT_PUBLIC_VERTICAL=${process.env.NEXT_PUBLIC_VERTICAL ?? "unset"}`,
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_SITE_URL",
      pass: (process.env.NEXT_PUBLIC_SITE_URL ?? "").includes("bookedconsult.com"),
      detail: `NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL ?? "unset"}`,
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_SALES_CALENDLY_URL",
      pass: !!process.env.NEXT_PUBLIC_SALES_CALENDLY_URL?.trim(),
      detail: "pilot call Calendly",
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_CALENDLY_URL",
      pass: !!process.env.NEXT_PUBLIC_CALENDLY_URL?.trim(),
      detail: "patient consult Calendly",
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_PARTNER_NAME",
      pass: !!process.env.NEXT_PUBLIC_PARTNER_NAME?.trim(),
      detail: "clinic name on patient LP",
      severity: "P1",
    },
    {
      id: "NEXT_PUBLIC_PILOT_LOOM_URL",
      pass: !!process.env.NEXT_PUBLIC_PILOT_LOOM_URL?.trim(),
      detail: "90s walkthrough",
      severity: "P2",
    },
    {
      id: "CRM_KV_KEY",
      pass: process.env.CRM_KV_KEY?.trim() === "booked-consult:crm",
      detail: `CRM_KV_KEY=${process.env.CRM_KV_KEY ?? "unset"}`,
      severity: "P1",
    },
    {
      id: "KV_REST_API_URL",
      pass: !!process.env.KV_REST_API_URL?.trim(),
      detail: "dedicated KV store",
      severity: "P0",
    },
  ];

  for (const { id, pass, detail, severity } of envChecks) {
    check(`P5-${id}`, "Env", pass, pass ? `${id} ok` : detail, severity);
  }

  const crmImage = join(root, "public", "images", "for-clinics", "crm-workspace.webp");
  check(
    "P5-crm-image",
    "Env",
    existsSync(crmImage),
    existsSync(crmImage) ? "crm-workspace.webp present" : "missing public/images/for-clinics/crm-workspace.webp",
    "P2",
  );

  const ogImage = join(root, "public", "og", "for-clinics.png");
  check(
    "P5-og-image",
    "Env",
    existsSync(ogImage),
    existsSync(ogImage) ? "og/for-clinics.png present" : "missing public/og/for-clinics.png",
    "P2",
  );
}

async function runBlbLive(blbUrl: string) {
  console.log("\n── Phase 6a: BLB live smoke ──\n");

  if (!blbUrl) {
    check(
      "P6a-00",
      "BLB live",
      true,
      "skipped — set BLB_POST_IMPL_URL",
      "P0",
      true,
    );
    return;
  }

  try {
    const home = await fetchText(`${blbUrl}/`);
    if (!home.ok) {
      check("P6a-99", "BLB live", false, home.error);
      return;
    }
    check("P6a-01", "BLB live", home.res?.ok === true, `GET / → ${home.res?.status}`);
    check("P6a-02", "BLB live", !home.finalUrl.includes("/for-clinics"), `no for-clinics redirect (${home.finalUrl})`);
    check(
      "P6a-03",
      "BLB live",
      !home.html.includes(HEALTHCARE_FOR_CLINICS.pilotPrice),
      "no pilot price on BLB home",
    );
    check(
      "P6a-04",
      "BLB live",
      home.html.includes("Bridging Loans Broker") ||
        home.html.includes(META_LP_METADATA.title.split("|")[0]!.trim()),
      "BLB branding on home",
    );
  } catch (err) {
    check("P6a-99", "BLB live", false, String(err));
  }
}

async function runHealthcareLive(hcUrl: string) {
  console.log("\n── Phase 6b: Booked Consult live smoke ──\n");

  if (!hcUrl) {
    check(
      "P6b-00",
      "HC live",
      true,
      "skipped — set HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com",
      "P0",
      true,
    );
    return;
  }

  try {
    const home = await fetchText(`${hcUrl}/`);
    if (!home.ok) {
      check("P6b-99", "HC live", false, home.error);
      return;
    }
    check("P6b-01", "HC live", home.res?.ok === true, `GET / → ${home.res?.status}`);
    check("P6b-02", "HC live", home.finalUrl.includes("/for-clinics"), `redirects to for-clinics (${home.finalUrl})`);

    const clinics = await fetchText(`${hcUrl}/for-clinics`);
    check("P6b-03", "HC live", clinics.res?.ok === true, `GET /for-clinics → ${clinics.res?.status}`);
    check("P6b-04", "Brand grep", !htmlHasBlb(clinics.html), "live /for-clinics zero BLB");
    check(
      "P6b-05",
      "HC live",
      clinics.html.includes(HEALTHCARE_FOR_CLINICS.headline) || clinics.html.includes("Booked Consult"),
      "B2B headline",
    );
    check("P6b-06", "HC live", clinics.html.includes(HEALTHCARE_FOR_CLINICS.pilotPrice), "pilot price");
    check("P6b-07", "HC live", clinics.html.includes("for-clinics-hero"), "hero id");
    check("P6b-08", "HC live", clinics.html.includes("Lead agency"), "comparison table");
    check("P6b-09", "HC live", clinics.html.includes("Frequently asked"), "FAQ section");

    const implants = await fetchText(`${hcUrl}/lp/implants`);
    check("P6b-10", "HC live", implants.res?.ok === true, `GET /lp/implants → ${implants.res?.status}`);
    check("P6b-11", "Brand grep", !htmlHasBlb(implants.html), "live /lp/implants zero BLB");
    check(
      "P6b-12",
      "HC live",
      implants.html.includes("implant") && !implants.html.includes("not regulated by the FCA"),
      "patient LP without FCA strip",
    );
    check("P6b-13", "HC live", implants.html.includes("quote-form"), "form anchor on implants LP");
    check("P6b-14", "HC live", implants.html.includes("<details"), "FAQ accordion live");
    check(
      "P6b-15",
      "HC live",
      implants.html.includes("Free initial consultation") || implants.html.includes("GDC-registered"),
      "compliance strip live",
    );
  } catch (err) {
    check("P6b-99", "HC live", false, String(err));
  }
}

async function runCrossContamination(blbUrl: string, hcUrl: string, liveApi: boolean) {
  console.log("\n── Phase 7: Cross-contamination ──\n");

  if (!blbUrl || !hcUrl) {
    check(
      "P7-00",
      "Cross-contam",
      true,
      "skipped — set BLB_POST_IMPL_URL and HEALTHCARE_POST_IMPL_URL",
      "P0",
      true,
    );
    return;
  }

  if (!liveApi) {
    check(
      "P7-01",
      "Cross-contam",
      true,
      "skipped — set HEALTHCARE_POST_AUDIT_LIVE=true to POST test lead",
      "P1",
      true,
    );
    check(
      "P7-02",
      "Cross-contam",
      true,
      "Manual: confirm healthcare lead NOT in BLB workspace; delete test lead in BC workspace",
      "P0",
    );
    return;
  }

  try {
    const stamp = Date.now();
    const email = `fc-post-impl-${stamp}@post-impl-audit.test`;
    const res = await fetch(`${hcUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vertical: "healthcare",
        stage: "complete",
        firstName: "FC",
        lastName: "PostImpl",
        email,
        phone: "07123456789",
        treatmentType: "single_implant",
        timeline: "within_3_months",
        postcode: "SW1A 1AA",
        budgetBand: "5k_10k",
        consent: true,
        source: "for_clinics_post_impl_audit",
      }),
    });
    const json = (await res.json()) as { id?: string; leadId?: string };
    const leadId = json.id ?? json.leadId;
    check(
      "P7-01",
      "Cross-contam",
      res.status === 201 && !!leadId,
      `healthcare API lead ${leadId ?? "failed"}`,
    );
    check(
      "P7-02",
      "Cross-contam",
      true,
      `Manual: verify lead ${leadId ?? "?"} NOT in BLB workspace; delete in Booked Consult workspace`,
      "P0",
    );
  } catch (err) {
    check("P7-99", "Cross-contam", false, String(err));
  }
}

function runSalesReadiness(blbUrl: string, hcUrl: string) {
  console.log("\n── Phase 8: Sales readiness ──\n");

  const automated = checks.filter((c) => !c.skipped);
  const p0Failed = automated.filter((c) => !c.pass && c.severity === "P0");
  const localHtmlRan = checks.some((c) => c.phase === "Local HTML" && c.id.startsWith("P3-") && !c.skipped);
  const localHtmlPass = !checks.some(
    (c) => c.phase === "Local HTML" && c.severity === "P0" && !c.pass && !c.skipped,
  );
  const hcLivePass = !checks.some(
    (c) => c.phase === "HC live" && c.severity === "P0" && !c.pass && !c.skipped,
  );
  const manualQa = checks.find((c) => c.id === "P4-01");
  const manualQaPass = manualQa?.skipped || manualQa?.pass === true;
  const hasSalesCalendly = !!process.env.NEXT_PUBLIC_SALES_CALENDLY_URL?.trim();
  const hasPatientCalendly = !!process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  const hasPartnerName = !!process.env.NEXT_PUBLIC_PARTNER_NAME?.trim();

  check(
    "P8-01",
    "Sales",
    p0Failed.length === 0,
    p0Failed.length === 0 ? "no P0 failures" : `${p0Failed.length} P0 failures`,
    "P0",
  );
  check(
    "P8-02",
    "Sales",
    !localHtmlRan || localHtmlPass,
    localHtmlRan ? "local HTML gates pass" : "local HTML not run (P1)",
    "P1",
  );
  check(
    "P8-03",
    "Sales",
    !hcUrl || hcLivePass,
    hcUrl ? "healthcare live smoke pass" : "live not run",
    "P0",
  );
  check(
    "P8-04",
    "Sales",
    manualQaPass,
    manualQa?.skipped ? "manual QA not scored (P1)" : `manual QA ${manualQa?.pass ? "pass" : "fail"}`,
    "P1",
  );
  check(
    "P8-05",
    "Sales",
    hasSalesCalendly,
    hasSalesCalendly ? "NEXT_PUBLIC_SALES_CALENDLY_URL set" : "missing pilot Calendly",
    "P1",
  );
  check(
    "P8-06",
    "Sales",
    hasPatientCalendly,
    hasPatientCalendly ? "NEXT_PUBLIC_CALENDLY_URL set" : "missing patient Calendly",
    "P1",
  );
  check(
    "P8-07",
    "Sales",
    hasPartnerName,
    hasPartnerName ? "NEXT_PUBLIC_PARTNER_NAME set" : "missing clinic name",
    "P1",
  );

  check(
    "P8-08",
    "Sales",
    !hcUrl || manualFlag("HEALTHCARE_GDC_SIGNOFF"),
    hcUrl ? "HEALTHCARE_GDC_SIGNOFF" : "GDC sign-off checked on live deploy",
    hcUrl ? "P0" : "P1",
  );
  check(
    "P8-09",
    "Sales",
    true,
    "Manual: pilot terms / LOI agreed — not automatable",
    "P1",
  );
}

function printVerdict(blbUrl: string, hcUrl: string) {
  const automated = checks.filter((c) => !c.skipped);
  const p0Failed = automated.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = automated.filter((c) => !c.pass && c.severity === "P1");
  const p2Failed = automated.filter((c) => !c.pass && c.severity === "P2");
  const passed = automated.filter((c) => c.pass).length;

  const protect = checks.find((c) => c.id === "P1-01");
  const hcPost = checks.find((c) => c.id === "P1-02");
  const build = checks.find((c) => c.id === "P1-03");

  const localForClinicsBlb = checks.find((c) => c.id === "P3-02");
  const localImplantsBlb = checks.find((c) => c.id === "P3-03");
  const localBlbHome = checks.find((c) => c.id === "P3-04");

  const manualQa = checks.find((c) => c.id === "P4-01");
  const manualScore = process.env.FOR_CLINICS_MANUAL_QA_SCORE?.trim();
  const implantsQa = checks.find((c) => c.id === "P4b-01");
  const implantsScore = process.env.IMPLANTS_MANUAL_QA_SCORE?.trim();

  const exitCode = p0Failed.length > 0 ? 1 : 0;

  console.log("\n════════════════════════════════════════");
  console.log(" OUTPUT (10/10 mandatory format)");
  console.log("════════════════════════════════════════\n");

  console.log("## Gate");
  console.log(
    `- healthcare-ads:post-implementation: ${exitCode === 0 ? "PASS" : "FAIL"} (P0=${p0Failed.length}, P1=${p1Failed.length}, exit ${exitCode})`,
  );

  console.log("\n## Automated (from script — do not re-derive manually)");
  console.log(`- vertical:protect: ${protect?.pass ? "PASS" : "FAIL"}`);
  console.log(`- healthcare:post-implementation: ${hcPost?.pass ? "PASS" : "FAIL"}`);
  console.log(`- build: ${build?.pass ? "PASS" : "FAIL"}`);
  console.log(
    `- Brand grep local: for-clinics ${localForClinicsBlb?.skipped ? "NOT RUN" : localForClinicsBlb?.pass ? "PASS" : "FAIL"} · implants ${localImplantsBlb?.skipped ? "NOT RUN" : localImplantsBlb?.pass ? "PASS" : "FAIL"} · BLB home ${localBlbHome?.skipped ? "NOT RUN" : localBlbHome?.pass ? "PASS" : "FAIL"}`,
  );
  const qualPass = !checks.some((c) => c.phase === "Qualification" && !c.pass && !c.skipped);
  console.log(`- Qualification unit tests: ${qualPass ? "PASS" : "FAIL"}`);
  console.log(
    `- Live smoke: BLB ${blbUrl ? (p0Failed.some((c) => c.phase === "BLB live") ? "FAIL" : "PASS") : "NOT RUN"} · BC ${hcUrl ? (p0Failed.some((c) => c.phase === "HC live") ? "FAIL" : "PASS") : "NOT RUN"} · cross-contam ${checks.some((c) => c.id === "P7-00" && c.skipped) ? "SKIPPED" : checks.some((c) => c.phase === "Cross-contam" && !c.pass && !c.skipped) ? "FAIL" : "PASS"}`,
  );

  console.log("\n## Manual only");
  console.log(
    `- FOR_CLINICS_MANUAL_QA_SCORE: ${manualQa?.skipped ? "NOT RUN" : `${manualScore ?? "?"}/10`}`,
  );
  console.log(
    `- IMPLANTS_MANUAL_QA_SCORE: ${implantsQa?.skipped ? "NOT RUN" : `${implantsScore ?? "?"}/10`}`,
  );
  console.log(`- HEALTHCARE_GDC_SIGNOFF: ${manualFlag("HEALTHCARE_GDC_SIGNOFF") ? "YES" : hcUrl ? "NO" : "NOT RUN"}`);
  console.log(
    `- HEALTHCARE_AD_LP_LOCK_CONFIRMED: ${manualFlag("HEALTHCARE_AD_LP_LOCK_CONFIRMED") ? "YES" : hcUrl ? "NO" : "NOT RUN"}`,
  );
  console.log(
    `- HEALTHCARE_PATIENT_E2E_CONFIRMED: ${manualFlag("HEALTHCARE_PATIENT_E2E_CONFIRMED") ? "PASS" : hcUrl ? "FAIL" : "NOT RUN"}`,
  );
  console.log(
    `- HEALTHCARE_META_EVENTS_CONFIRMED: ${manualFlag("HEALTHCARE_META_EVENTS_CONFIRMED") ? "PASS" : hcUrl ? "FAIL" : "NOT RUN"}`,
  );
  console.log(
    `- HEALTHCARE_CLINIC_CALENDLY_CONFIRMED: ${manualFlag("HEALTHCARE_CLINIC_CALENDLY_CONFIRMED") ? "YES" : "NO/NOT RUN"}`,
  );

  console.log("\n## Findings");
  console.log(`P0: ${p0Failed.length === 0 ? "none" : p0Failed.map((f) => `[${f.id}] ${f.detail ?? f.phase}`).join("; ")}`);
  console.log(`P1: ${p1Failed.length === 0 ? "none" : p1Failed.map((f) => `[${f.id}] ${f.detail ?? f.phase}`).join("; ")}`);
  console.log(`P2: ${p2Failed.length === 0 ? "none" : p2Failed.map((f) => `[${f.id}] ${f.detail ?? f.phase}`).join("; ")}`);

  console.log("\n## Fixes applied");
  console.log("- none (audit only — agent should list files if fixes were made in this run)");

  console.log("\n## Verdict");
  const blbLiveFail = checks.some(
    (c) => c.phase === "BLB live" && !c.pass && !c.skipped && c.severity === "P0",
  );
  const hcLiveFail = checks.some(
    (c) => c.phase === "HC live" && !c.pass && !c.skipped && c.severity === "P0",
  );
  const shipBlb = !blbUrl || !blbLiveFail;
  const shipHc = !!hcUrl && !hcLiveFail && p0Failed.length === 0;
  const metaAds =
    p0Failed.length === 0 &&
    (!hcUrl || !hcLiveFail) &&
    !!process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() &&
    !!process.env.NEXT_PUBLIC_PARTNER_NAME?.trim() &&
    implantsQa?.pass === true &&
    (!hcUrl ||
      (manualFlag("HEALTHCARE_GDC_SIGNOFF") &&
        manualFlag("HEALTHCARE_AD_LP_LOCK_CONFIRMED") &&
        manualFlag("HEALTHCARE_PATIENT_E2E_CONFIRMED") &&
        manualFlag("HEALTHCARE_META_EVENTS_CONFIRMED")));

  const pilotOutbound =
    p0Failed.length === 0 &&
    (manualQa?.pass === true || (!hcUrl && !!manualQa?.skipped)) &&
    (!hcUrl || !hcLiveFail) &&
    !!process.env.NEXT_PUBLIC_SALES_CALENDLY_URL?.trim();

  console.log(`- Project A (BLB): ${blbUrl ? (shipBlb && p0Failed.length === 0 ? "SHIP" : "NO-SHIP") : "NOT RUN"}`);
  console.log(`- Project B (Booked Consult): ${hcUrl ? (shipHc ? "SHIP" : "NO-SHIP") : "NOT RUN"}`);
  console.log(`- Pilot outbound (/for-clinics): ${pilotOutbound ? "YES" : "NO"}`);
  console.log(`- Meta ads (/lp/implants): ${metaAds ? "YES" : "NO"}`);

  console.log("\n## Remaining before 10/10 polish");
  const polish: string[] = [];
  if (!existsSync(join(root, "public", "images", "for-clinics", "crm-workspace.webp"))) {
    polish.push("public/images/for-clinics/crm-workspace.webp");
  }
  if (!existsSync(join(root, "public", "og", "for-clinics.png"))) {
    polish.push("public/og/for-clinics.png");
  }
  if (!process.env.NEXT_PUBLIC_PILOT_LOOM_URL?.trim()) polish.push("NEXT_PUBLIC_PILOT_LOOM_URL");
  if (!process.env.NEXT_PUBLIC_SALES_CALENDLY_URL?.trim()) polish.push("NEXT_PUBLIC_SALES_CALENDLY_URL");
  if (!manualScore) polish.push("FOR_CLINICS_MANUAL_QA_SCORE after visual review");
  if (!process.env.NEXT_PUBLIC_CALENDLY_URL?.trim()) polish.push("NEXT_PUBLIC_CALENDLY_URL");
  if (!process.env.NEXT_PUBLIC_PARTNER_NAME?.trim()) polish.push("NEXT_PUBLIC_PARTNER_NAME");
  if (!implantsScore) polish.push("IMPLANTS_MANUAL_QA_SCORE after visual review");
  if (hcUrl && !manualFlag("HEALTHCARE_GDC_SIGNOFF")) polish.push("HEALTHCARE_GDC_SIGNOFF=true");
  if (hcUrl && !manualFlag("HEALTHCARE_AD_LP_LOCK_CONFIRMED")) polish.push("HEALTHCARE_AD_LP_LOCK_CONFIRMED=true");
  if (hcUrl && !manualFlag("HEALTHCARE_PATIENT_E2E_CONFIRMED")) polish.push("HEALTHCARE_PATIENT_E2E_CONFIRMED=true");
  if (hcUrl && !manualFlag("HEALTHCARE_META_EVENTS_CONFIRMED")) polish.push("HEALTHCARE_META_EVENTS_CONFIRMED=true");
  if (!existsSync(join(root, "public", "og", "implants.png"))) polish.push("public/og/implants.png");
  console.log(polish.length === 0 ? "- none" : polish.map((p) => `- ${p}`).join("\n"));

  console.log("\n════════════════════════════════════════");
  console.log(`Automated: ${passed}/${automated.length} passed | P0: ${p0Failed.length} | P1: ${p1Failed.length}`);
  console.log("════════════════════════════════════════\n");

  printTriageForP0();

  if (p0Failed.length > 0) {
    console.log("P0 failures:");
    for (const f of p0Failed) {
      console.log(`  • [${f.phase}] ${f.id}${f.detail ? `: ${f.detail}` : ""}`);
    }
    console.log("");
  }
}

async function main() {
  const blbUrl = (process.env.BLB_POST_IMPL_URL ?? process.env.META_LP_POST_IMPL_URL ?? "").replace(
    /\/$/,
    "",
  );
  const hcUrl = (process.env.HEALTHCARE_POST_IMPL_URL ?? "").replace(/\/$/, "");
  const localUrl = (process.env.LOCAL_POST_IMPL_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const liveApi = process.env.HEALTHCARE_POST_AUDIT_LIVE === "true";

  console.log("\nBooked Consult — healthcare ads post-implementation audit (10/10)\n");

  printStep1Guide();
  runPreflight();
  runAutomatedGate();
  runStaticForClinics();
  runStaticImplantsLp();

  let localBase = "";
  const probe = await fetchText(`${localUrl}/for-clinics`);
  if (probe.ok && probe.res?.ok) {
    localBase = localUrl;
  }
  await runLocalHtmlGates(localBase);
  runQualificationTests();
  runAdLpLockStatic();

  runManualQaGate();
  runImplantsManualQaGate();
  runEnvChecklist(!!hcUrl || liveApi);
  await runBlbLive(blbUrl);
  await runHealthcareLive(hcUrl);
  await runCrossContamination(blbUrl, hcUrl, liveApi);
  runManualComplianceGates(hcUrl);
  runSalesReadiness(blbUrl, hcUrl);

  printEconomicsAndWeek1();
  printVerdict(blbUrl, hcUrl);

  const p0 = checks.filter((c) => !c.skipped && !c.pass && c.severity === "P0").length;
  process.exit(p0 > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
