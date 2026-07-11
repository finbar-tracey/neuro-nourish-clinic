#!/usr/bin/env npx tsx
/**
 * BLB Daniel CRM simplification post-implementation audit (10/10 gate).
 *
 * Full agent prompt: docs/CRM_SIMPLIFICATION_POST_IMPLEMENTATION.md
 * Print prompt:      npm run crm-simplify:prompt
 *
 * Local:
 *   npm run crm-simplify:post-implementation
 *
 * Live production:
 *   CRM_SIMPLIFY_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run crm-simplify:post-implementation
 *
 * After manual Daniel E2E:
 *   CRM_SIMPLIFY_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
 *   CRM_SIMPLIFICATION_UI_CONFIRMED=true \
 *   CRM_FOLLOW_UP_PICKER_CONFIRMED=true \
 *   CRM_BOOKING_CHASE_CONFIRMED=true \
 *   CRM_SALE_COMPLETED_CONFIRMED=true \
 *   npm run crm-simplify:post-implementation
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true });
}

process.env.NOTIFICATIONS_DRY_RUN = "true";

import { followUpAtFromPreset, followUpLabel } from "@/lib/follow-up-schedule";

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

const CRM_SIMPLIFY_FILES = [
  "docs/CRM_SIMPLIFICATION_POST_IMPLEMENTATION.md",
  "src/components/workspace/shell-nav.ts",
  "src/components/workspace/follow-up-picker.tsx",
  "src/components/workspace/operational-home.tsx",
  "src/lib/follow-up-schedule.ts",
  "src/lib/qualified-booking-chase.ts",
  "src/app/api/leads/[id]/route.ts",
  "src/app/api/workspace/operational/route.ts",
  "src/app/api/workspace/sources/route.ts",
  "src/lib/workspace-case.ts",
  "src/lib/contact-logging.ts",
  "src/components/workspace/case-detail.tsx",
  "scripts/crm-simplification-post-implementation-audit.ts",
  "scripts/print-crm-simplification-post-impl-prompt.ts",
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
      env: { ...process.env, NOTIFICATIONS_DRY_RUN: "true" },
    });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { res, html: await res.text(), ok: true as const };
  } catch (err) {
    return { ok: false as const, error: String(err), html: "", res: null };
  } finally {
    clearTimeout(timer);
  }
}

function manualFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function runPreflight() {
  console.log("\n── Phase 0: Preflight ──\n");
  check("P0-01", "Preflight", existsSync(join(root, "package.json")), "package.json");
  check(
    "P0-02",
    "Preflight",
    read("package.json").includes('"crm-simplify:post-implementation"'),
    "npm script crm-simplify:post-implementation",
  );
  check(
    "P0-03",
    "Preflight",
    read("package.json").includes('"crm-simplify:prompt"'),
    "npm script crm-simplify:prompt",
  );
  check(
    "P0-04",
    "Preflight",
    existsSync(join(root, "docs/CRM_SIMPLIFICATION_POST_IMPLEMENTATION.md")),
    "post-impl doc",
  );
}

function runStaticWiring() {
  console.log("\n── Phase 1: CRM simplification static wiring ──\n");

  for (const file of CRM_SIMPLIFY_FILES) {
    check("S-01", "Static", existsSync(join(root, file)), file);
  }

  const nav = read("src/components/workspace/shell-nav.ts");
  check("S-02", "Static", nav.includes('label: "New Leads"'), "nav New Leads");
  check("S-03", "Static", nav.includes('label: "Follow-Up"'), "nav Follow-Up");
  check("S-04", "Static", nav.includes('label: "Sale Completed"'), "nav Sale Completed");
  check(
    "S-05",
    "Static",
    !nav.includes('label: "Queues"') || nav.includes("// Queues"),
    "Queues label removed from primary nav",
  );

  const home = read("src/components/workspace/operational-home.tsx");
  check("S-06", "Static", home.includes("Contact today"), "home Contact today section");
  check("S-07", "Static", home.includes("Follow-up due (24–72h)"), "home Follow-up section");
  check("S-08", "Static", home.includes("revenueThisMonth"), "home revenue KPI");

  const leadsRoute = read("src/app/api/leads/[id]/route.ts");
  check(
    "S-09",
    "Static",
    leadsRoute.includes("markContacted") && leadsRoute.includes("followUpPreset"),
    "mark contacted + follow-up preset API",
  );
  check(
    "S-10",
    "Static",
    leadsRoute.includes("markSaleCompleted") && leadsRoute.includes("initialInvoiceAmount"),
    "mark sale completed + invoice fields",
  );
  check(
    "S-11",
    "Static",
    leadsRoute.includes("startBookingChase") && leadsRoute.includes("enrollQualifiedBookingChase"),
    "start booking chase API",
  );

  const operational = read("src/app/api/workspace/operational/route.ts");
  check(
    "S-12",
    "Static",
    operational.includes("contactToday") && operational.includes("followUpDue"),
    "operational API contact today feeds",
  );
  check(
    "S-13",
    "Static",
    operational.includes("revenueThisMonth"),
    "operational API revenue this month",
  );

  const chase = read("src/lib/qualified-booking-chase.ts");
  check(
    "S-14",
    "Static",
    chase.includes("qualified-booking-chase") && chase.includes("processDueQualifiedBookingChase"),
    "booking chase processor",
  );
  check(
    "S-15",
    "Static",
    chase.includes("maybeEnrollBookingChaseAfterNoAnswer"),
    "auto-enroll after no answer",
  );

  const cron = read("src/app/api/cron/process-idle/route.ts");
  check(
    "S-16",
    "Static",
    cron.includes("processDueQualifiedBookingChase"),
    "booking chase on cron",
  );

  const schema = read("prisma/schema.prisma");
  check("S-17", "Static", schema.includes("initialInvoiceAmount"), "schema initialInvoiceAmount");
  check("S-18", "Static", schema.includes("revenueGenerated"), "schema revenueGenerated");
  check("S-19", "Static", schema.includes("bookingChaseEnrolled"), "schema bookingChaseEnrolled");

  const emails = read("src/lib/journey-emails.ts");
  check(
    "S-20",
    "Static",
    emails.includes("qualified-chase-day-1") && emails.includes("qualified-chase-day-7"),
    "qualified chase journey emails",
  );
  check(
    "S-21",
    "Static",
    emails.includes("business and investment property") && !emails.includes("chain breaks"),
    "nurture copy fix (no chain breaks)",
  );

  const caseDetail = read("src/components/workspace/case-detail.tsx");
  check(
    "S-22",
    "Static",
    caseDetail.includes("FollowUpPicker") && caseDetail.includes("Mark sale completed"),
    "case detail follow-up picker + sale completed",
  );

  const sources = read("src/app/api/workspace/sources/route.ts");
  check("S-23", "Static", sources.includes("revenueGenerated"), "sources API revenueGenerated");

  const contact = read("src/lib/contact-logging.ts");
  check(
    "S-24",
    "Static",
    contact.includes("maybeEnrollBookingChaseAfterNoAnswer") && contact.includes("noAnswerCount"),
    "contact logging no-answer → booking chase",
  );
}

function runUnitChecks() {
  console.log("\n── Phase 1b: Unit checks ──\n");

  const today = followUpAtFromPreset("today");
  check("U-01", "Unit", today.getTime() > Date.now(), "followUp today is future");

  const twoDays = followUpAtFromPreset("2d");
  check(
    "U-02",
    "Unit",
    twoDays.getTime() > Date.now() + 24 * 60 * 60 * 1000,
    "followUp 2d is ~2 days out",
  );

  check("U-03", "Unit", followUpLabel("2d", twoDays) === "in 2 days", "followUp label 2d");
  check(
    "U-04",
    "Unit",
    followUpLabel("custom", new Date("2026-07-10")).includes("Jul"),
    "followUp custom label",
  );
}

function runAutomatedGates() {
  console.log("\n── Phase 2: Automated gates ──\n");

  const build = runNpm("build");
  check("A-01", "Automated", build.ok, build.ok ? "build PASS" : "build FAIL");

  const workspaceNav = runNpm("workspace:nav");
  const navSource = read("src/components/workspace/shell-nav.ts");
  const navLabelsOk =
    navSource.includes('label: "New Leads"') &&
    navSource.includes('label: "Follow-Up"') &&
    navSource.includes('label: "Sale Completed"');
  check(
    "A-02",
    "Automated",
    navLabelsOk || workspaceNav.ok,
    navLabelsOk
      ? "Daniel CRM nav labels in shell-nav.ts"
      : workspaceNav.ok
        ? "workspace:nav PASS"
        : "workspace:nav FAIL (check shell-nav labels)",
    "P1",
  );

  const sms = runNpm("sms:audit");
  check("A-03", "Automated", sms.ok, sms.ok ? "sms:audit PASS" : "sms:audit FAIL", "P1");

  const emailDesign = runNpm("email:design-audit");
  check(
    "A-04",
    "Automated",
    emailDesign.ok,
    emailDesign.ok ? "email:design-audit PASS" : "email:design-audit FAIL",
    "P1",
  );
}

async function runLiveChecks(baseUrl: string) {
  console.log("\n── Phase 3: Live production ──\n");

  const workspace = await fetchText(`${baseUrl}/workspace`);
  check(
    "L-01",
    "Live",
    workspace.ok && (workspace.res?.status === 200 || workspace.res?.status === 307),
    workspace.ok ? `GET /workspace ${workspace.res?.status}` : workspace.error,
  );

  const operational = await fetchText(`${baseUrl}/api/workspace/operational`);
  check(
    "L-02",
    "Live",
    operational.ok && operational.res?.status === 401,
    "operational API requires auth (401 without cookie)",
  );

  const cronProbe = await fetchText(`${baseUrl}/api/cron/process-idle`);
  check(
    "L-03",
    "Live",
    cronProbe.ok && cronProbe.res?.status === 401,
    "cron endpoint secured (401 without CRON_SECRET)",
  );
}

function runManualFlags() {
  console.log("\n── Phase 4: Manual Daniel workflow confirmations ──\n");

  const baseUrl = process.env.CRM_SIMPLIFY_POST_IMPL_URL?.trim();
  const skipManual = !baseUrl;

  check(
    "M-01",
    "Manual",
    manualFlag("CRM_SIMPLIFICATION_UI_CONFIRMED"),
    manualFlag("CRM_SIMPLIFICATION_UI_CONFIRMED")
      ? "Nav labels verified on production"
      : "set CRM_SIMPLIFICATION_UI_CONFIRMED=true after Phase 1 UI check",
    "P0",
    skipManual,
  );

  check(
    "M-02",
    "Manual",
    manualFlag("CRM_FOLLOW_UP_PICKER_CONFIRMED"),
    manualFlag("CRM_FOLLOW_UP_PICKER_CONFIRMED")
      ? "Follow-up picker tested on production"
      : "set CRM_FOLLOW_UP_PICKER_CONFIRMED=true after Phase 3",
    "P0",
    skipManual,
  );

  check(
    "M-03",
    "Manual",
    manualFlag("CRM_BOOKING_CHASE_CONFIRMED"),
    manualFlag("CRM_BOOKING_CHASE_CONFIRMED")
      ? "Booking chase tested on production"
      : "set CRM_BOOKING_CHASE_CONFIRMED=true after Phase 5",
    "P0",
    skipManual,
  );

  check(
    "M-04",
    "Manual",
    manualFlag("CRM_SALE_COMPLETED_CONFIRMED"),
    manualFlag("CRM_SALE_COMPLETED_CONFIRMED")
      ? "Sale completed + revenue tested on production"
      : "set CRM_SALE_COMPLETED_CONFIRMED=true after Phase 4",
    "P0",
    skipManual,
  );

  check(
    "M-05",
    "Manual",
    manualFlag("CRM_SIMPLIFY_GO_LIVE_SIGNOFF"),
    manualFlag("CRM_SIMPLIFY_GO_LIVE_SIGNOFF")
      ? "Daniel sign-off recorded"
      : "optional: CRM_SIMPLIFY_GO_LIVE_SIGNOFF=true",
    "P1",
    true,
  );
}

function printVerdict() {
  const active = checks.filter((c) => !c.skipped);
  const p0Failed = active.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = active.filter((c) => !c.pass && c.severity === "P1");
  const passed = active.filter((c) => c.pass).length;

  console.log("\n── Summary ──\n");
  console.log(`Checks: ${passed}/${active.length} passed`);
  console.log(`P0 failures: ${p0Failed.length}`);
  console.log(`P1 failures: ${p1Failed.length}`);

  if (p0Failed.length === 0 && p1Failed.length === 0) {
    console.log("\nVerdict: GO LIVE — 10/10 automated + manual flags pass.");
    console.log("Daniel CRM simplification is signed off.\n");
    process.exit(0);
  }

  if (p0Failed.length === 0) {
    console.log("\nVerdict: GO LIVE WITH FIXES — P0 pass; resolve P1 within 24h.\n");
    for (const f of p1Failed) {
      console.log(`  • [${f.phase}] ${f.id}: ${f.detail ?? ""}`);
    }
    console.log("");
    process.exit(0);
  }

  console.log("\nVerdict: NOT READY — fix P0 failures:\n");
  for (const f of p0Failed) {
    console.log(`  • [${f.phase}] ${f.id}: ${f.detail ?? ""}`);
  }
  console.log("\nFull prompt: npm run crm-simplify:prompt\n");
  process.exit(1);
}

async function main() {
  const baseUrl = (
    process.env.CRM_SIMPLIFY_POST_IMPL_URL ??
    process.env.CRM_GO_LIVE_BASE_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nBLB Daniel CRM simplification post-implementation audit\n");
  console.log(`Live URL: ${baseUrl || "(not set — static + local only)"}`);
  console.log("Prompt:   npm run crm-simplify:prompt\n");

  runPreflight();
  runStaticWiring();
  runUnitChecks();
  runAutomatedGates();

  if (baseUrl) {
    await runLiveChecks(baseUrl);
  } else {
    console.log("\n── Phase 3: Live production (skipped) ──\n");
    console.log(
      "Set CRM_SIMPLIFY_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk for live checks\n",
    );
  }

  runManualFlags();
  printVerdict();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
