#!/usr/bin/env npx tsx
/**
 * Master go-live gate — full checklist from docs/MASTER_GO_LIVE.md
 *
 * Pre-deploy:
 *   NOTIFICATIONS_DRY_RUN=true META_CAPI_DRY_RUN=true npm run go-live:master
 *
 * Post-deploy (live URL + prod env advisory):
 *   CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

const baseUrl =
  process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
  process.env.MASTER_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
  process.env.POSTLAUNCH_BASE_URL?.replace(/\/$/, "");

type Tier = "P0" | "P1";
type Phase = "predeploy" | "config" | "live";

type Step = {
  phase: Phase;
  name: string;
  cmd: string;
  args: string[];
  tier: Tier;
  advisory?: boolean;
  liveOnly?: boolean;
  env?: Record<string, string>;
};

const steps: Step[] = [
  // ── Pre-deploy ──
  { phase: "predeploy", name: "Production build", cmd: "npm", args: ["run", "build"], tier: "P0" },
  { phase: "predeploy", name: "Prelaunch audit", cmd: "npm", args: ["run", "prelaunch:audit"], tier: "P0" },
  { phase: "predeploy", name: "Form validation", cmd: "npm", args: ["run", "form:audit"], tier: "P0" },
  { phase: "predeploy", name: "UK phone post-impl", cmd: "npm", args: ["run", "phone:post-impl"], tier: "P0" },
  { phase: "predeploy", name: "Form E2E", cmd: "npm", args: ["run", "form:e2e"], tier: "P0" },
  { phase: "predeploy", name: "Form → CRM wiring", cmd: "npm", args: ["run", "form:crm-wiring"], tier: "P0" },
  { phase: "predeploy", name: "Case OS audit", cmd: "npm", args: ["run", "case:audit"], tier: "P0" },
  { phase: "predeploy", name: "CRM audit", cmd: "npm", args: ["run", "crm:audit"], tier: "P0" },
  { phase: "predeploy", name: "Tracking audit", cmd: "npm", args: ["run", "tracking:audit"], tier: "P0" },
  { phase: "predeploy", name: "Meta LP compliance", cmd: "npm", args: ["run", "meta-lp:audit"], tier: "P0" },
  { phase: "predeploy", name: "Email journey audit", cmd: "npm", args: ["run", "email:audit"], tier: "P0" },
  { phase: "predeploy", name: "Email CTA audit", cmd: "npm", args: ["run", "email:cta-audit"], tier: "P0" },
  { phase: "predeploy", name: "Email assets audit", cmd: "npm", args: ["run", "email:assets-audit"], tier: "P0" },
  { phase: "predeploy", name: "SMS journey audit", cmd: "npm", args: ["run", "sms:audit"], tier: "P0" },
  { phase: "predeploy", name: "Thank-you / booking UI", cmd: "npm", args: ["run", "thank-you:audit"], tier: "P0" },
  { phase: "predeploy", name: "Workspace UI", cmd: "npm", args: ["run", "workspace:audit"], tier: "P0" },
  { phase: "predeploy", name: "Workspace nav", cmd: "npm", args: ["run", "workspace:nav"], tier: "P1" },
  { phase: "predeploy", name: "Workspace mobile", cmd: "npm", args: ["run", "workspace:mobile"], tier: "P1" },
  { phase: "predeploy", name: "Closed queue workflow", cmd: "npm", args: ["run", "workflow:closed"], tier: "P0" },
  { phase: "predeploy", name: "Win-back workflow", cmd: "npm", args: ["run", "workflow:winback"], tier: "P0" },
  { phase: "predeploy", name: "Win-back full audit", cmd: "npm", args: ["run", "workflow:winback:full"], tier: "P0" },
  {
    phase: "predeploy",
    name: "CRM post-implementation",
    cmd: "npm",
    args: ["run", "crm:post-implementation"],
    tier: "P0",
  },
  {
    phase: "predeploy",
    name: "CRM v2 post-implementation",
    cmd: "npm",
    args: ["run", "crm-v2:post-implementation"],
    tier: "P0",
  },
  {
    phase: "predeploy",
    name: "CRM simplification post-implementation",
    cmd: "npm",
    args: ["run", "crm-simplify:post-implementation"],
    tier: "P1",
    advisory: true,
  },
  {
    phase: "predeploy",
    name: "Sequence flows post-implementation",
    cmd: "npm",
    args: ["run", "sequence:post-implementation"],
    tier: "P0",
  },
  {
    phase: "predeploy",
    name: "Workspace post-implementation",
    cmd: "npm",
    args: ["run", "workspace:post-implementation"],
    tier: "P0",
  },
  {
    phase: "predeploy",
    name: "CSV import post-implementation",
    cmd: "npm",
    args: ["run", "sequence:import"],
    tier: "P0",
  },
  {
    phase: "predeploy",
    name: "CRM weekly backup",
    cmd: "npm",
    args: ["run", "crm:backup"],
    tier: "P0",
  },
  { phase: "predeploy", name: "Sequence funnel unit", cmd: "npm", args: ["run", "sequence:funnel"], tier: "P0" },
  { phase: "predeploy", name: "LP deep-link routes", cmd: "npm", args: ["run", "lp:routes-audit"], tier: "P0" },
  { phase: "predeploy", name: "Borrower deep links", cmd: "npm", args: ["run", "deep-links:audit"], tier: "P0" },
  { phase: "predeploy", name: "Notification routing", cmd: "npm", args: ["run", "notifications:audit"], tier: "P0" },
  { phase: "predeploy", name: "Completion workflow", cmd: "npm", args: ["run", "workflow:audit"], tier: "P1", advisory: true },
  {
    phase: "predeploy",
    name: "Win-back live API E2E",
    cmd: "npm",
    args: ["run", "workflow:winback:e2e"],
    tier: "P1",
    advisory: true,
  },
  { phase: "predeploy", name: "Microsoft Graph", cmd: "npm", args: ["run", "graph:audit"], tier: "P1", advisory: true },

  // ── Config ──
  { phase: "config", name: "Production env keys", cmd: "npm", args: ["run", "go-live:check"], tier: "P0" },

  // ── Live (post-deploy) ──
  {
    phase: "live",
    name: "Live site smoke (postlaunch)",
    cmd: "npm",
    args: ["run", "postlaunch:audit"],
    tier: "P0",
    liveOnly: true,
  },
  {
    phase: "live",
    name: "Meta LP post-implementation",
    cmd: "npm",
    args: ["run", "meta-lp:post-impl"],
    tier: "P0",
    liveOnly: true,
    env: baseUrl ? { META_LP_POST_IMPL_URL: baseUrl } : undefined,
  },
  {
    phase: "live",
    name: "Cron health check",
    cmd: "npm",
    args: ["run", "cron:check"],
    tier: "P0",
    liveOnly: true,
  },
  {
    phase: "live",
    name: "CRM post-implementation (live env)",
    cmd: "npm",
    args: ["run", "crm:post-implementation"],
    tier: "P0",
    liveOnly: true,
    env: { CRM_POST_AUDIT_LIVE: "true" },
  },
  {
    phase: "live",
    name: "Sequence post-implementation (live env)",
    cmd: "npm",
    args: ["run", "sequence:post-implementation"],
    tier: "P0",
    liveOnly: true,
    env: { SEQUENCE_POST_AUDIT_LIVE: "true" },
  },
  {
    phase: "live",
    name: "Workspace post-implementation (live env)",
    cmd: "npm",
    args: ["run", "workspace:post-implementation"],
    tier: "P0",
    liveOnly: true,
    env: { WORKSPACE_POST_AUDIT_LIVE: "true" },
  },
  {
    phase: "live",
    name: "CSV import post-implementation (live env)",
    cmd: "npm",
    args: ["run", "sequence:import"],
    tier: "P0",
    liveOnly: true,
    env: { SEQUENCE_IMPORT_POST_AUDIT_LIVE: "true" },
  },
  {
    phase: "live",
    name: "CRM backup (live env)",
    cmd: "npm",
    args: ["run", "crm:backup"],
    tier: "P0",
    liveOnly: true,
    env: { CRM_BACKUP_AUDIT_LIVE: "true" },
  },
];

function dryEnv(extra?: Record<string, string>) {
  return {
    ...process.env,
    NOTIFICATIONS_DRY_RUN: "true",
    META_CAPI_DRY_RUN: "true",
    ...(baseUrl ? { POSTLAUNCH_BASE_URL: baseUrl, CRM_GO_LIVE_BASE_URL: baseUrl } : {}),
    ...extra,
  };
}

function runStep(step: Step): { ok: boolean; advisory: boolean; skipped: boolean } {
  if (step.liveOnly && !baseUrl) {
    return { ok: true, advisory: false, skipped: true };
  }

  const result = spawnSync(step.cmd, step.args, {
    stdio: "pipe",
    env: dryEnv(step.env),
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    return { ok: true, advisory: Boolean(step.advisory), skipped: false };
  }

  if (step.advisory) {
    return { ok: true, advisory: true, skipped: false };
  }

  const out = (result.stdout?.toString() ?? "") + (result.stderr?.toString() ?? "");
  if (out.trim()) {
    console.log(out.trim().split("\n").slice(-12).join("\n"));
  }
  return { ok: false, advisory: false, skipped: false };
}

function printManualSection(title: string, items: string[]) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 58 - title.length))}`);
  for (const item of items) {
    console.log(`   [ ] ${item}`);
  }
}

function main() {
  const docPath = resolve("docs/MASTER_GO_LIVE.md");
  const hasDoc = existsSync(docPath);

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("MASTER GO-LIVE GATE");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`Doc: ${hasDoc ? "docs/MASTER_GO_LIVE.md" : "⚠️  missing"}`);
  console.log(`Mode: ${baseUrl ? `LIVE (${baseUrl})` : "PRE-DEPLOY (set CRM_GO_LIVE_BASE_URL for live checks)"}`);
  console.log("Dry-run: NOTIFICATIONS_DRY_RUN=true · META_CAPI_DRY_RUN=true\n");

  let p0Failed = 0;
  let p1Warn = 0;
  let passed = 0;
  let skipped = 0;
  const failedNames: string[] = [];
  const skippedNames: string[] = [];

  const phases: Phase[] = ["predeploy", "config", "live"];
  const phaseLabels: Record<Phase, string> = {
    predeploy: "PRE-DEPLOY AUTOMATED (P0)",
    config: "PRODUCTION CONFIG",
    live: "POST-DEPLOY LIVE",
  };

  for (const phase of phases) {
    const phaseSteps = steps.filter((s) => s.phase === phase);
    if (phaseSteps.length === 0) continue;

    console.log(`\n## ${phaseLabels[phase]}\n`);

    for (const step of phaseSteps) {
      const tierLabel = step.tier === "P1" ? "[P1] " : "";
      process.stdout.write(`▶ ${tierLabel}${step.name}… `);

      const { ok, advisory, skipped: stepSkipped } = runStep(step);

      if (stepSkipped) {
        console.log("⏭️  (skipped — no CRM_GO_LIVE_BASE_URL)");
        skipped++;
        skippedNames.push(step.name);
        continue;
      }

      if (ok) {
        console.log(advisory ? "⚠️  (advisory)" : "✅");
        passed++;
        if (advisory && step.tier === "P1") p1Warn++;
      } else {
        console.log("❌");
        failedNames.push(step.name);
        if (step.tier === "P0") p0Failed++;
        else p1Warn++;
      }
    }
  }

  // ── Score ──
  const score =
    p0Failed > 0 ? Math.max(4, 10 - p0Failed * 2) : p1Warn > 2 ? 8 : p1Warn > 0 ? 9 : 10;

  let verdict: "GO LIVE" | "GO LIVE WITH FIXES" | "DO NOT GO LIVE";
  if (p0Failed > 0) verdict = "DO NOT GO LIVE";
  else if (p1Warn > 0 || skipped > 0) verdict = "GO LIVE WITH FIXES";
  else verdict = "GO LIVE";

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("RESULT");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`Automated passed: ${passed}`);
  console.log(`P0 failures: ${p0Failed}`);
  console.log(`P1 advisories: ${p1Warn}`);
  if (skipped) console.log(`Live checks skipped: ${skipped}`);
  if (failedNames.length) {
    console.log("\nFailed:");
    for (const n of failedNames) console.log(`  ✗ ${n}`);
  }
  console.log(`\nAUTOMATED VERDICT: ${verdict}`);
  console.log(`SCORE: ${score}/10 (automated only — manual smoke required for 10/10)`);

  console.log("\nTOP PRODUCTION RISKS:");
  console.log("  1. NOTIFICATIONS_DRY_RUN=true on Vercel — nothing delivered");
  console.log("  2. Cron not firing — nurture/win-back stall");
  console.log("  3. KV misconfiguration — leads or win-back fields lost");
  console.log("  4. Wrong ad URL — use /lp?utm_source=…");
  console.log("  5. Re-engagement / Sequence flows not monitored");

  if (!baseUrl) {
    console.log("\n💡 Re-run with:");
    console.log("   CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:master");
  }

  console.log("\n💡 Manual E2E agent prompts:");
  console.log("   npm run crm-v2:prompt        (Daniel CRM v2 — primary)");
  console.log("   npm run go-live:prompt       (full stack)");
  console.log("   docs/CRM_V2_POST_IMPLEMENTATION.md");

  printManualSection("§6 Borrower journey (P0)", [
    "Open /lp with UTMs → qualify → book priority call",
    "Case in workspace — record Case ID: ____________",
    "CONSULTATION_BOOKED + teamsMeetingUrl + timeline",
    "Borrower + Daniel notifications received",
    "Meta Lead + Schedule events",
    "Daniel workspace login",
  ]);

  printManualSection("§7 CRM & queues (P0)", [
    "Nav counts match boards",
    "Mark lost → Lost / Disqualified",
    "Mark lost + win-back → Re-engagement too",
    "Sequence preview on mark-lost",
    "Re-engagement metrics on board",
  ]);

  printManualSection("§8 Win-back v2 (P0)", [
    "Standard sequence (No response) — 6 steps",
    "Long sequence (Funding no longer needed) — 3 emails",
    "Pause / resume / auto-pause on contacted",
    "Re-open stops win-back; unsubscribe stops",
    "Cron sends due step; skips paused",
  ]);

  printManualSection("§9 Sequence flows viewer (P1)", [
    "Automations → Sequence flows — 3 cards",
    "Waiting / passed / due today on known case",
    "Auto-refresh after 60s",
  ]);

  printManualSection("§10 Cron (P0)", [
    "Vercel cron last success for /api/cron/process-idle",
    "Response includes winback + winbackDigest",
  ]);

  console.log("\n── SIGN-OFF (docs/MASTER_GO_LIVE.md §15) ─────────────────");
  console.log("   Date: ____________  Deploy ID: ____________  Case ID: ____________");
  console.log("   [ ] go-live:master pass  [ ] go-live:check  [ ] Manual §6–8 §10");
  console.log("   VERDICT: GO LIVE / GO LIVE WITH FIXES / DO NOT GO LIVE\n");

  if (p0Failed > 0) process.exit(1);
  process.exit(0);
}

main();
