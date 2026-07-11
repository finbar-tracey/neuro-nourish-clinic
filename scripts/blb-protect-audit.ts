#!/usr/bin/env npx tsx
/**
 * BLB isolation audit — run before merging healthcare vertical work.
 *
 * Run: VERTICAL=bridging npm run blb:protect
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  brandName,
  crmFileStoreName,
  crmKvKeyName,
  getVertical,
} from "../src/lib/vertical-config";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Result = { ok: boolean; label: string; detail?: string };
const results: Result[] = [];

function check(ok: boolean, label: string, detail?: string) {
  results.push({ ok, label, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function main() {
  console.log("\nBLB protect audit\n");

  delete process.env.VERTICAL;
  delete process.env.NEXT_PUBLIC_VERTICAL;

  check(getVertical() === "bridging", "getVertical() defaults to bridging when env unset");
  check(crmFileStoreName() === ".blb-crm.json", "CRM file store defaults to .blb-crm.json");
  check(
    crmKvKeyName() === "bridging-loans-broker:crm",
    "CRM KV key defaults to bridging-loans-broker:crm",
  );
  check(brandName() === "Bridging Loans Broker", "brandName() defaults to BLB");

  const metaLp = read("src/lib/meta-lp-copy.ts");
  check(!/healthcare|booked consult/i.test(metaLp), "meta-lp-copy.ts has no healthcare copy");

  const home = read("src/app/page.tsx");
  check(home.includes("FacebookLandingPage"), "Home page still renders FacebookLandingPage");
  check(home.includes("isHealthcare()"), "Home redirect gated on isHealthcare()");

  const leadsRoute = read("src/app/api/leads/route.ts");
  check(
    leadsRoute.includes('body?.vertical === "healthcare"'),
    "Healthcare lead POST is opt-in via body.vertical",
  );

  const metaLpAudit = read("scripts/meta-lp-compliance-audit.ts");
  check(
    !metaLpAudit.includes("healthcare-lp-copy") && !metaLpAudit.includes("for-clinics"),
    "meta-lp:audit file list unchanged (no healthcare routes)",
  );

  const shellNav = read("src/components/workspace/shell-nav.ts");
  check(shellNav.includes("SHELL_NAV_SECTIONS"), "BLB shell nav sections preserved");
  check(shellNav.includes("shellNavSectionsForVertical"), "Shell nav uses vertical helper");

  const shell = read("src/components/workspace/shell.tsx");
  check(
    shell.includes("shellNavSectionsForVertical") && shell.includes("mobileTabHrefsForVertical"),
    "Shell component uses vertical nav helpers",
  );

  const healthcareOnly = [
    "src/lib/healthcare-lp-copy.ts",
    "src/lib/healthcare-lead-submit.ts",
    "src/app/for-clinics/page.tsx",
    "src/app/lp/implants/page.tsx",
  ];
  for (const file of healthcareOnly) {
    check(existsSync(join(root, file)), `Healthcare file exists: ${file}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${failed.length === 0 ? "PASS" : "FAIL"} — ${results.length - failed.length}/${results.length} checks\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
