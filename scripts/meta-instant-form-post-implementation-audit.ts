#!/usr/bin/env npx tsx
/**
 * BLB Meta instant form + go-live post-implementation audit (10/10 gate).
 *
 * Full agent prompt: docs/META_INSTANT_FORM_POST_IMPLEMENTATION.md
 * Print prompt:      npm run meta:prompt
 *
 * Local:
 *   npm run meta:post-implementation
 *
 * Live production:
 *   META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run meta:post-implementation
 *
 * After manual E2E:
 *   META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
 *   META_WEBHOOK_TEST_LEAD_CONFIRMED=true \
 *   META_COMPLETE_E2E_CONFIRMED=true \
 *   META_ADS_READY_CONFIRMED=true \
 *   npm run meta:post-implementation
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
process.env.META_CAPI_DRY_RUN = "true";

import { signCompletionToken, verifyCompletionToken } from "@/lib/completion-link";
import { mapMetaLeadFields } from "@/lib/meta-leadgen";
import { metaPartialCaseDefaults } from "@/lib/case-capture";
import { META_INSTANT_FORM_SOURCE } from "@/lib/meta-source";

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

const META_FILES = [
  "src/app/api/meta/leadgen/route.ts",
  "src/lib/meta-leadgen.ts",
  "src/lib/completion-link.ts",
  "src/lib/meta-capture-notifications.ts",
  "src/lib/meta-complete-chase.ts",
  "src/lib/meta-source.ts",
  "src/app/lp/complete/page.tsx",
  "src/components/forms/meta-complete-form.tsx",
  "scripts/meta-webhook-test.ts",
  "docs/META_INSTANT_FORM_POST_IMPLEMENTATION.md",
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

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { res, html: await res.text(), finalUrl: res.url, ok: true as const };
  } catch (err) {
    return { ok: false as const, error: String(err), html: "", finalUrl: url, res: null };
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
    read("package.json").includes('"meta:post-implementation"'),
    "npm script meta:post-implementation",
  );
  check(
    "P0-03",
    "Preflight",
    read("package.json").includes('"meta:prompt"'),
    "npm script meta:prompt",
  );
  check(
    "P0-04",
    "Preflight",
    existsSync(join(root, "docs/META_INSTANT_FORM_POST_IMPLEMENTATION.md")),
    "post-impl doc",
  );
}

function runStaticWiring() {
  console.log("\n── Phase 2: Meta instant form static wiring ──\n");

  for (const file of META_FILES) {
    check("S-01", "Static", existsSync(join(root, file)), file);
  }

  const webhook = read("src/app/api/meta/leadgen/route.ts");
  check(
    "S-02",
    "Static",
    webhook.includes("sendMetaIngestNotifications") && !webhook.includes("sendBrokerNewLeadAlert"),
    "webhook uses meta ingest bundle only",
  );
  check(
    "S-03",
    "Static",
    webhook.includes("metaLeadgenId") && webhook.includes("metaPartialCaseDefaults"),
    "partial lead payload",
  );
  check(
    "S-04",
    "Static",
    read("src/lib/meta-capture-notifications.ts").includes("sendBrokerMetaAwaitingAlert"),
    "soft Daniel alert on ingest",
  );
  check(
    "S-05",
    "Static",
    !read("src/lib/meta-capture-notifications.ts").includes("sendBrokerNewLeadAlert"),
    "no call-now broker alert on meta ingest",
  );

  const leadsRoute = read("src/app/api/leads/route.ts");
  check(
    "S-06",
    "Static",
    leadsRoute.includes("requireMetaCompletionToken") && leadsRoute.includes("verifyCompletionToken"),
    "completion token gate on /api/leads",
  );
  check(
    "S-07",
    "Static",
    leadsRoute.includes("sendBrokerMetaQualifiedTierAlert") && leadsRoute.includes("cancelMetaCompleteChaseTasks"),
    "HOT/WARM + chase cancel on complete",
  );
  check(
    "S-08",
    "Static",
    leadsRoute.includes("CompleteRegistration"),
    "Meta CAPI CompleteRegistration on qualified",
  );

  const cron = read("src/app/api/cron/process-idle/route.ts");
  check(
    "S-09",
    "Static",
    cron.includes("processDueMetaCompleteChase"),
    "meta chase on cron",
  );

  const completePage = read("src/app/lp/complete/page.tsx");
  check(
    "S-10",
    "Static",
    completePage.includes("verifyCompletionToken") && completePage.includes("NOINDEX_ROBOTS"),
    "/lp/complete token + noindex",
  );

  check(
    "S-11",
    "Static",
    read("src/lib/case-capture.ts").includes("metaPartialCaseDefaults"),
    "Awaiting qualification defaults",
  );
  check(
    "S-12",
    "Static",
    read("src/lib/operational-queue.ts").includes("Awaiting qualification"),
    "normalizeOperationalLead respects meta partial",
  );

  check(
    "S-13",
    "Static",
    read("src/lib/journey-emails.ts").includes("meta-capture-welcome"),
    "meta capture journey email",
  );

  check(
    "S-14",
    "Static",
    read("scripts/meta-webhook-test.ts").includes('config({ path: ".env.local"'),
    "webhook test loads .env.local",
  );
}

function runUnitChecks() {
  console.log("\n── Phase 2b: Unit checks ──\n");

  process.env.COMPLETION_LINK_SECRET = process.env.COMPLETION_LINK_SECRET ?? "audit-test-secret";
  const leadId = "abc123def456789012345678";
  const token = signCompletionToken(leadId);
  check(
    "U-01",
    "Unit",
    Boolean(token && verifyCompletionToken(leadId, token)),
    "completion token sign/verify",
  );
  check(
    "U-02",
    "Unit",
    !verifyCompletionToken(leadId, "bad.token"),
    "rejects invalid token",
  );

  const mapped = mapMetaLeadFields([
    { name: "first_name", values: ["Jane"] },
    { name: "last_name", values: ["Smith"] },
    { name: "email", values: ["jane@example.com"] },
    { name: "phone_number", values: ["07700900123"] },
    { name: "loan_amount", values: ["£250,000"] },
    { name: "loan_purpose", values: ["Auction Purchase"] },
    { name: "timeframe", values: ["Within 7 days"] },
  ]);
  check("U-03", "Unit", mapped.loanPurpose === "auction", `purpose=${mapped.loanPurpose}`);
  check("U-04", "Unit", mapped.timeframe === "urgent", `timeframe=${mapped.timeframe}`);
  check("U-05", "Unit", mapped.loanAmount >= 50_000, `amount=${mapped.loanAmount}`);

  const partial = metaPartialCaseDefaults();
  check(
    "U-06",
    "Unit",
    partial.nextAction === "Awaiting qualification" && partial.callbackDueAt === null,
    "meta partial SLA",
  );
  check(
    "U-07",
    "Unit",
    META_INSTANT_FORM_SOURCE === "meta_instant_form",
    "source constant",
  );
}

function runAutomatedGates() {
  console.log("\n── Phase 1: Automated gates ──\n");

  const build = runNpm("build");
  check("A-01", "Automated", build.ok, build.ok ? "build PASS" : "build FAIL");

  const metaWebhook = runNpm("meta:webhook-test");
  check(
    "A-02",
    "Automated",
    metaWebhook.ok,
    metaWebhook.ok ? "meta:webhook-test PASS" : "meta:webhook-test FAIL",
  );

  const metaLp = runNpm("meta-lp:audit");
  check("A-03", "Automated", metaLp.ok, metaLp.ok ? "meta-lp:audit PASS" : "meta-lp:audit FAIL", "P1");

  const sms = runNpm("sms:audit");
  check("A-04", "Automated", sms.ok, sms.ok ? "sms:audit PASS" : "sms:audit FAIL", "P1");

  const tracking = runNpm("tracking:audit");
  check(
    "A-05",
    "Automated",
    tracking.ok,
    tracking.ok ? "tracking:audit PASS" : "tracking:audit FAIL",
    "P1",
  );
}

async function runLiveChecks(baseUrl: string) {
  console.log("\n── Phase 4: Live production ──\n");

  const home = await fetchText(`${baseUrl}/`);
  check(
    "L-01",
    "Live",
    home.ok && home.res?.status === 200,
    home.ok ? `GET / ${home.res?.status}` : home.error,
  );
  if (home.ok) {
    check(
      "L-02",
      "Live",
      home.html.includes("Finance Enquiry") || home.html.includes("Bridging"),
      "homepage is BLB",
    );
  }

  const completeNoToken = await fetchText(`${baseUrl}/lp/complete?lead=bad&token=bad`);
  check(
    "L-03",
    "Live",
    completeNoToken.ok && completeNoToken.html.includes("Link unavailable"),
    "/lp/complete rejects bad token",
  );

  const webhookGet = await fetchText(`${baseUrl}/api/meta/leadgen?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test`);
  check(
    "L-04",
    "Live",
    webhookGet.ok && webhookGet.res?.status === 403,
    "webhook GET rejects bad verify token (403)",
  );

  const cronHint = runNpm("cron:check");
  check(
    "L-05",
    "Live",
    cronHint.ok || manualFlag("META_CRON_CONFIRMED"),
    cronHint.ok ? "cron:check PASS" : "set META_CRON_CONFIRMED=true if verified manually",
    "P1",
  );
}

function runManualFlags() {
  console.log("\n── Phase 5–7: Manual confirmations ──\n");

  const webhookConfirmed = manualFlag("META_WEBHOOK_TEST_LEAD_CONFIRMED");
  check(
    "M-01",
    "Manual",
    webhookConfirmed,
    webhookConfirmed
      ? "Meta test lead on production"
      : "set META_WEBHOOK_TEST_LEAD_CONFIRMED=true after Phase 5 Step A",
    "P0",
    !process.env.META_POST_IMPL_URL?.trim(),
  );

  const completeConfirmed = manualFlag("META_COMPLETE_E2E_CONFIRMED");
  check(
    "M-02",
    "Manual",
    completeConfirmed,
    completeConfirmed
      ? "/lp/complete E2E on production"
      : "set META_COMPLETE_E2E_CONFIRMED=true after Phase 5 Step B–C",
    "P0",
    !process.env.META_POST_IMPL_URL?.trim(),
  );

  const adsReady = manualFlag("META_ADS_READY_CONFIRMED");
  check(
    "M-03",
    "Manual",
    adsReady,
    adsReady ? "Instant form + webhook signed off" : "set META_ADS_READY_CONFIRMED=true before ad spend",
    "P0",
    !process.env.META_POST_IMPL_URL?.trim(),
  );

  check(
    "M-04",
    "Manual",
    manualFlag("META_GO_LIVE_SIGNOFF"),
    manualFlag("META_GO_LIVE_SIGNOFF") ? "Daniel sign-off recorded" : "optional: META_GO_LIVE_SIGNOFF=true",
    "P1",
    true,
  );
}

function printEconomics() {
  console.log("\n── Launch metrics (reference) ──\n");
  console.log("Instant CPL ≤ £30 · SMS click ≥ 45% · Complete ≥ 70% · Qualified ≥ 75% · Qualified CPL ≤ £60");
  console.log("Week 1: test leads only · Week 2: £20–30/day CBO if Phase 5 passed");
  console.log("Pause if qualified CPL > £80 after £100 spend\n");
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
    console.log("Meta ads may start at £20–30/day after Daniel sign-off.\n");
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

  console.log("\nVerdict: DO NOT GO LIVE — fix P0 failures:\n");
  for (const f of p0Failed) {
    console.log(`  • [${f.phase}] ${f.id}: ${f.detail ?? ""}`);
  }
  console.log("\nFull prompt: npm run meta:prompt\n");
  process.exit(1);
}

async function main() {
  const baseUrl = (
    process.env.META_POST_IMPL_URL ??
    process.env.META_LP_POST_IMPL_URL ??
    process.env.CRM_GO_LIVE_BASE_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nBLB Meta instant form post-implementation audit\n");
  console.log(`Live URL: ${baseUrl || "(not set — static + local only)"}`);
  console.log("Prompt:   npm run meta:prompt\n");

  runPreflight();
  runStaticWiring();
  runUnitChecks();
  runAutomatedGates();

  if (baseUrl) {
    await runLiveChecks(baseUrl);
  } else {
    console.log("\n── Phase 4: Live production (skipped) ──\n");
    console.log("Set META_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk for live checks\n");
  }

  runManualFlags();
  printEconomics();
  printVerdict();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
