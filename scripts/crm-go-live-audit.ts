#!/usr/bin/env npx tsx
/**
 * CRM & workflow go-live gate — dry-run code audits + optional live checks.
 * Does NOT send SMS/email (NOTIFICATIONS_DRY_RUN=true).
 *
 * Run: npm run crm:go-live
 * Live: CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run crm:go-live
 */
import { spawnSync } from "node:child_process";

process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

const baseUrl =
  process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
  process.env.POSTLAUNCH_BASE_URL?.replace(/\/$/, "");

type Step = {
  name: string;
  cmd: string;
  args: string[];
  tier: "P0" | "P1";
  advisory?: boolean;
  liveOnly?: boolean;
};

const steps: Step[] = [
  { name: "Form validation", cmd: "npm", args: ["run", "form:audit"], tier: "P0" },
  { name: "Form E2E", cmd: "npm", args: ["run", "form:e2e"], tier: "P0" },
  { name: "Form → CRM wiring", cmd: "npm", args: ["run", "form:crm-wiring"], tier: "P0" },
  { name: "Case OS audit", cmd: "npm", args: ["run", "case:audit"], tier: "P0" },
  { name: "CRM audit", cmd: "npm", args: ["run", "crm:audit"], tier: "P0" },
  { name: "Tracking audit", cmd: "npm", args: ["run", "tracking:audit"], tier: "P0" },
  { name: "Email journey audit", cmd: "npm", args: ["run", "email:audit"], tier: "P0" },
  { name: "Email CTA audit", cmd: "npm", args: ["run", "email:cta-audit"], tier: "P0" },
  { name: "Email assets audit", cmd: "npm", args: ["run", "email:assets-audit"], tier: "P0" },
  { name: "SMS journey audit", cmd: "npm", args: ["run", "sms:audit"], tier: "P0" },
  { name: "Thank-you / booking UI", cmd: "npm", args: ["run", "thank-you:audit"], tier: "P0" },
  { name: "Workspace UI", cmd: "npm", args: ["run", "workspace:audit"], tier: "P0" },
  { name: "Closed queue workflow", cmd: "npm", args: ["run", "workflow:closed"], tier: "P0" },
  { name: "Win-back workflow", cmd: "npm", args: ["run", "workflow:winback"], tier: "P0" },
  { name: "Win-back full audit", cmd: "npm", args: ["run", "workflow:winback:full"], tier: "P0" },
  {
    name: "CRM post-implementation audit",
    cmd: "npm",
    args: ["run", "crm:post-implementation"],
    tier: "P0",
  },
  {
    name: "Sequence flows post-implementation",
    cmd: "npm",
    args: ["run", "sequence:post-implementation"],
    tier: "P0",
  },
  {
    name: "Workspace post-implementation",
    cmd: "npm",
    args: ["run", "workspace:post-implementation"],
    tier: "P0",
  },
  { name: "LP deep-link routes", cmd: "npm", args: ["run", "lp:routes-audit"], tier: "P0" },
  { name: "Borrower deep links", cmd: "npm", args: ["run", "deep-links:audit"], tier: "P0" },
  { name: "Notification routing", cmd: "npm", args: ["run", "notifications:audit"], tier: "P0" },
  { name: "Production env keys", cmd: "npm", args: ["run", "go-live:check"], tier: "P0" },
  { name: "Microsoft Graph", cmd: "npm", args: ["run", "graph:audit"], tier: "P1", advisory: true },
  {
    name: "Live site + CRM capture",
    cmd: "npm",
    args: ["run", "postlaunch:audit"],
    tier: "P0",
    liveOnly: true,
  },
];

function runStep(step: Step): { ok: boolean; advisory: boolean } {
  const env = {
    ...process.env,
    NOTIFICATIONS_DRY_RUN: "true",
    META_CAPI_DRY_RUN: "true",
    ...(baseUrl ? { POSTLAUNCH_BASE_URL: baseUrl, CRM_GO_LIVE_BASE_URL: baseUrl } : {}),
  };

  const result = spawnSync(step.cmd, step.args, {
    stdio: "pipe",
    env,
    shell: process.platform === "win32",
  });

  const ok = result.status === 0;
  if (ok) {
    console.log("✅");
    return { ok: true, advisory: Boolean(step.advisory) };
  }

  if (step.advisory) {
    console.log("⚠️  (advisory — configure keys or run live smoke manually)");
    return { ok: true, advisory: true };
  }

  console.log("❌");
  const out = (result.stdout?.toString() ?? "") + (result.stderr?.toString() ?? "");
  if (out.trim()) {
    console.log(out.trim().split("\n").slice(-10).join("\n"));
  }
  return { ok: false, advisory: false };
}

function main() {
  console.log("\n🎯 CRM & workflow go-live gate (dry-run — no outbound notifications)\n");

  let p0Failed = 0;
  let p1Warn = 0;
  const skipped: string[] = [];

  for (const step of steps) {
    if (step.liveOnly && !baseUrl) {
      skipped.push(step.name);
      continue;
    }

    const label = step.tier === "P1" ? `[P1] ` : "";
    process.stdout.write(`▶ ${label}${step.name}… `);
    const { ok, advisory } = runStep(step);
    if (!ok) {
      if (step.tier === "P0") p0Failed++;
      else if (step.advisory) p1Warn++;
    }
  }

  if (skipped.length) {
    console.log("\n⏭️  Skipped live checks (set CRM_GO_LIVE_BASE_URL for production smoke):");
    for (const name of skipped) console.log(`   • ${name}`);
  }

  console.log("\n── Manual P0 (after automated gate) ──");
  console.log("   1. One real /lp → qualify → book → note case ID");
  console.log("   2. Workspace: BOOKED, teamsMeetingUrl, timeline");
  console.log("   3. Meta Events Manager: Lead + Schedule");
  console.log("   4. Daniel workspace login confirmed");
  console.log("\n   See docs/CRM_GO_LIVE.md for full checklist + sign-off.\n");

  if (p0Failed > 0) {
    console.log(`❌ ${p0Failed} P0 step(s) failed — fix before ads.\n`);
    process.exit(1);
  }

  console.log("✅ All P0 automated checks passed.");
  if (p1Warn) console.log(`⚠️  ${p1Warn} P1 advisory step(s) — review before scaling spend.`);
  if (!baseUrl) console.log("💡 Re-run with CRM_GO_LIVE_BASE_URL=… for live CRM capture check.");
  console.log();
  process.exit(0);
}

main();
