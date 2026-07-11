#!/usr/bin/env npx tsx
/**
 * Master go-live gate — runs all code audits with notifications dry-run.
 * Does NOT send SMS or email (NOTIFICATIONS_DRY_RUN=true).
 *
 * Run: npm run go-live:audit
 */
import { spawnSync } from "node:child_process";

process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

const steps: Array<{ name: string; cmd: string; args: string[]; advisory?: boolean }> = [
  { name: "Prelaunch audit", cmd: "npm", args: ["run", "prelaunch:audit"] },
  { name: "Form validation", cmd: "npm", args: ["run", "form:audit"] },
  { name: "UK phone post-impl", cmd: "npm", args: ["run", "phone:post-impl"] },
  { name: "Form E2E", cmd: "npm", args: ["run", "form:e2e"] },
  { name: "Form CRM wiring", cmd: "npm", args: ["run", "form:crm-wiring"] },
  { name: "Case OS audit", cmd: "npm", args: ["run", "case:audit"] },
  { name: "CRM audit", cmd: "npm", args: ["run", "crm:audit"] },
  { name: "Closed queue workflow", cmd: "npm", args: ["run", "workflow:closed"] },
  { name: "Win-back full audit", cmd: "npm", args: ["run", "workflow:winback:full"] },
  { name: "Tracking audit", cmd: "npm", args: ["run", "tracking:audit"] },
  { name: "Meta LP compliance", cmd: "npm", args: ["run", "meta-lp:audit"] },
  { name: "Email journey audit", cmd: "npm", args: ["run", "email:audit"] },
  { name: "SMS journey audit", cmd: "npm", args: ["run", "sms:audit"] },
  { name: "Email PDF design audit", cmd: "npm", args: ["run", "email:design-audit"] },
  { name: "Go-live env check", cmd: "npm", args: ["run", "go-live:check"], advisory: true },
  { name: "Microsoft Graph check", cmd: "npm", args: ["run", "graph:audit"], advisory: true },
];

console.log("\n🚀 Go-live audit gate (dry-run — no outbound notifications)\n");

let failed = 0;

for (const step of steps) {
  process.stdout.write(`▶ ${step.name}… `);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "pipe",
    env: { ...process.env, NOTIFICATIONS_DRY_RUN: "true" },
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    console.log("✅");
  } else if (step.advisory) {
    console.log("⚠️  (keys pending — expected pre-deploy)");
  } else {
    console.log("❌");
    failed++;
    const out = (result.stdout?.toString() ?? "") + (result.stderr?.toString() ?? "");
    if (out.trim()) console.log(out.trim().split("\n").slice(-8).join("\n"));
  }
}

console.log(
  failed === 0
    ? "\n✅ All code audits passed. Add production keys (npm run go-live:check) then deploy.\n"
    : `\n❌ ${failed} step(s) failed — fix before go-live.\n`,
);

process.exit(failed === 0 ? 0 : 1);
