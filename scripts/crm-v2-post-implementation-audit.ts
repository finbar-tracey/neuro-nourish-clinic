#!/usr/bin/env npx tsx
/**
 * BLB Daniel CRM v2 post-implementation audit (10/10 gate).
 *
 * Full agent prompt: docs/CRM_V2_POST_IMPLEMENTATION.md
 * Print prompt:      npm run crm-v2:prompt
 *
 * Local:
 *   npm run crm-v2:post-implementation
 *
 * Live production:
 *   CRM_V2_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run crm-v2:post-implementation
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { MOBILE_TAB_HREFS } from "../src/components/workspace/shell-nav";

config();
if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true });
}

process.env.NOTIFICATIONS_DRY_RUN = "true";

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

function runNpm(script: string): boolean {
  try {
    execSync(`npm run ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NOTIFICATIONS_DRY_RUN: "true" },
    });
    return true;
  } catch {
    return false;
  }
}

async function fetchStatus(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { ok: true as const, status: res.status };
  } catch (err) {
    return { ok: false as const, error: String(err) };
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
    read("package.json").includes('"crm-v2:post-implementation"'),
    "npm script crm-v2:post-implementation",
  );
  check(
    "P0-03",
    "Preflight",
    read("package.json").includes('"crm-v2:prompt"'),
    "npm script crm-v2:prompt",
  );
  check(
    "P0-04",
    "Preflight",
    existsSync(join(root, "docs/CRM_V2_POST_IMPLEMENTATION.md")),
    "CRM v2 post-impl doc",
  );
  check(
    "P0-05",
    "Preflight",
    read("package.json").includes('"crm-v2:deep-audit"'),
    "npm script crm-v2:deep-audit",
  );
  check(
    "P0-06",
    "Preflight",
    existsSync(join(root, "scripts/crm-v2-deep-audit.ts")),
    "CRM v2 deep audit script",
  );
}

function runStaticWiring() {
  console.log("\n── Phase 1: CRM v2 static wiring ──\n");

  const nav = read("src/components/workspace/shell-nav.ts");
  check("S-01", "Static", nav.includes('label: "New Leads"'), "nav New Leads");
  check("S-02", "Static", nav.includes('label: "Follow-Up"'), "nav Follow-Up");
  check("S-03", "Static", nav.includes('label: "Completed"'), "nav Completed");
  check(
    "S-04",
    "Static",
    !nav.includes('label: "Sale Completed"'),
    "Sale Completed label removed",
  );
  check(
    "S-05",
    "Static",
    MOBILE_TAB_HREFS.length === 4 &&
      MOBILE_TAB_HREFS.join(",") ===
        "/workspace,/workspace/inbox,/workspace/callbacks,/workspace/completions",
    "4 mobile tabs (Home, New, Follow, Done)",
  );
  check(
    "S-06",
    "Static",
    nav.includes('label: "Documents"') && nav.includes("showBadge: false"),
    "Documents in More (no badge)",
  );

  const home = read("src/components/workspace/operational-home.tsx");
  check("S-07", "Static", home.includes("Call now"), "home Call now section");
  check("S-08", "Static", home.includes("followUpOverdue"), "home overdue KPI");
  check("S-09", "Static", home.includes("invoiceThisMonth"), "home invoice KPI");
  check("S-10", "Static", !home.includes("Awaiting Documents"), "no docs on home");

  const leadsPost = read("src/app/api/leads/route.ts");
  const captureBlock = leadsPost.split("if (isNewCapture)")[1]?.split("} else {")[0] ?? "";
  check(
    "S-11",
    "Static",
    captureBlock.includes("sendCaptureSms(lead)") &&
      !captureBlock.includes("sendBrokerNewLeadAlert"),
    "step 2 capture: no broker SMS",
  );
  check(
    "S-12",
    "Static",
    leadsPost.includes("void sendBrokerNewLeadAlert(lead)"),
    "step 3 qualified: Google broker SMS",
  );

  const leadsPatch = read("src/app/api/leads/[id]/route.ts");
  check(
    "S-13",
    "Static",
    leadsPatch.includes("completeLeadFromInitialInvoice") &&
      leadsPatch.includes("rescheduleFollowUp") &&
      leadsPatch.includes("reopenToFollowUp"),
    "auto-complete + reschedule + reopen API",
  );
  check(
    "S-14",
    "Static",
    existsSync(join(root, "src/lib/lead-completion.ts")),
    "lead-completion.ts",
  );

  const workspaceCase = read("src/lib/workspace-case.ts");
  check(
    "S-15",
    "Static",
    workspaceCase.includes("isFollowUpActive") &&
      workspaceCase.includes("hasInitialInvoicePaid") &&
      workspaceCase.includes("isFollowUpOverdue"),
    "follow-up until paid helpers",
  );
  check(
    "S-16",
    "Static",
    workspaceCase.includes("formCompleted") && workspaceCase.includes('"NEW_LEAD"'),
    "new leads require formCompleted",
  );

  const caseDetail = read("src/components/workspace/case-detail.tsx");
  check(
    "S-17",
    "Static",
    caseDetail.includes("Initial invoice paid") &&
      caseDetail.includes("Commission earned") &&
      !caseDetail.includes("Mark sale completed"),
    "two-box economics UI",
  );
  check(
    "S-18",
    "Static",
    caseDetail.includes("Reschedule follow-up") && caseDetail.includes("Reopen to follow-up"),
    "reschedule + reopen actions",
  );
  check(
    "S-19",
    "Static",
    !caseDetail.includes("Start booking chase"),
    "manual booking chase button removed",
  );

  const inbox = read("src/components/workspace/inbox-board.tsx");
  check(
    "S-20",
    "Static",
    inbox.includes('caseInOperationalQueue(c, "NEW_LEAD")') && !inbox.includes("INBOX_QUEUES.map"),
    "inbox = new leads only",
  );

  const operational = read("src/app/api/workspace/operational/route.ts");
  check(
    "S-21",
    "Static",
    operational.includes("buildFollowUpActiveFeed") &&
      operational.includes("followUpOverdue") &&
      operational.includes("invoiceThisMonth"),
    "operational API v2 feeds",
  );

  const booking = read("src/lib/operational-queue.ts");
  check(
    "S-22",
    "Static",
    booking.includes("priorityCallOperationalFields") &&
      booking.includes("AWAITING_CALLBACK") &&
      booking.includes("conversationStarted: true"),
    "booking → follow-up queue",
  );
}

function runAutomatedGates() {
  console.log("\n── Phase 2: Automated gates ──\n");

  check("A-01", "Automated", runNpm("crm-v2:deep-audit"), "crm-v2:deep-audit PASS", "P0");
  check("A-02", "Automated", runNpm("form:crm-wiring"), "form:crm-wiring PASS", "P0");
  check("A-03", "Automated", runNpm("build"), "build PASS");
  check("A-04", "Automated", runNpm("workspace:nav"), "workspace:nav PASS", "P0");
  check("A-05", "Automated", runNpm("workspace:mobile"), "workspace:mobile PASS", "P0");
  check("A-06", "Automated", runNpm("workspace:audit"), "workspace:audit PASS", "P0");
}

async function runLiveChecks(baseUrl: string) {
  console.log("\n── Phase 3: Live production ──\n");

  const workspace = await fetchStatus(`${baseUrl}/workspace`);
  check(
    "L-01",
    "Live",
    workspace.ok && (workspace.status === 200 || workspace.status === 307),
    workspace.ok ? `GET /workspace ${workspace.status}` : workspace.error,
  );

  const operational = await fetchStatus(`${baseUrl}/api/workspace/operational`);
  check(
    "L-02",
    "Live",
    operational.ok && operational.status === 401,
    "operational API requires auth",
  );
}

function runManualFlags() {
  console.log("\n── Phase 4: Manual Daniel workflow confirmations ──\n");

  const skipManual = !process.env.CRM_V2_POST_IMPL_URL?.trim();

  check(
    "M-01",
    "Manual",
    manualFlag("CRM_V2_UI_CONFIRMED"),
    manualFlag("CRM_V2_UI_CONFIRMED")
      ? "3-queue nav verified"
      : "set CRM_V2_UI_CONFIRMED=true after Phase 1",
    "P0",
    skipManual,
  );
  check(
    "M-02",
    "Manual",
    manualFlag("CRM_V2_NOTIFICATIONS_CONFIRMED"),
    manualFlag("CRM_V2_NOTIFICATIONS_CONFIRMED")
      ? "qualified-only SMS verified"
      : "set CRM_V2_NOTIFICATIONS_CONFIRMED=true after Phase 2",
    "P0",
    skipManual,
  );
  check(
    "M-03",
    "Manual",
    manualFlag("CRM_V2_FOLLOW_UP_CONFIRMED"),
    manualFlag("CRM_V2_FOLLOW_UP_CONFIRMED")
      ? "follow-up until paid verified"
      : "set CRM_V2_FOLLOW_UP_CONFIRMED=true after Phase 4",
    "P0",
    skipManual,
  );
  check(
    "M-04",
    "Manual",
    manualFlag("CRM_V2_COMPLETION_CONFIRMED"),
    manualFlag("CRM_V2_COMPLETION_CONFIRMED")
      ? "box 1 + box 2 verified"
      : "set CRM_V2_COMPLETION_CONFIRMED=true after Phase 5",
    "P0",
    skipManual,
  );
  check(
    "M-05",
    "Manual",
    manualFlag("CRM_V2_GO_LIVE_SIGNOFF"),
    manualFlag("CRM_V2_GO_LIVE_SIGNOFF")
      ? "Daniel sign-off recorded"
      : "optional: CRM_V2_GO_LIVE_SIGNOFF=true",
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
    console.log("\nVerdict: GO LIVE — CRM v2 automated + manual flags pass.\n");
    process.exit(0);
  }

  if (p0Failed.length === 0) {
    console.log("\nVerdict: GO LIVE WITH FIXES — P0 pass; resolve P1 within 24h.\n");
    process.exit(0);
  }

  console.log("\nVerdict: NOT READY — fix P0 failures.");
  console.log("Full prompt: npm run crm-v2:prompt\n");
  process.exit(1);
}

async function main() {
  const baseUrl = (
    process.env.CRM_V2_POST_IMPL_URL ??
    process.env.CRM_GO_LIVE_BASE_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nBLB Daniel CRM v2 post-implementation audit\n");
  console.log(`Live URL: ${baseUrl || "(not set — static + local only)"}`);
  console.log("Prompt:   npm run crm-v2:prompt\n");

  runPreflight();
  runStaticWiring();
  runAutomatedGates();

  if (baseUrl) {
    await runLiveChecks(baseUrl);
  } else {
    console.log("\n── Phase 3: Live production (skipped) ──\n");
    console.log(
      "Set CRM_V2_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk for live checks\n",
    );
  }

  runManualFlags();
  printVerdict();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
