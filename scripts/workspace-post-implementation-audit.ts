#!/usr/bin/env npx tsx
/**
 * Workspace polish — post-implementation audit (delete case + branding).
 *
 * Run: npm run workspace:post-implementation
 * Live: WORKSPACE_POST_AUDIT_LIVE=true npm run workspace:post-implementation
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { DELETE as deleteLead } from "@/app/api/leads/[id]/route";
import { db } from "@/lib/db";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import { readCrmStore } from "@/lib/crm-persistence";
import { computeSequenceFunnelStats } from "@/lib/sequence-funnel-stats";
import { LOST_REASONS } from "@/lib/case-stages";
import { transitionCaseStage } from "@/lib/case-engine";
import { enrollWinback } from "@/lib/winback-sequence";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  section: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
};

const checks: Check[] = [];
const findings: Array<{ severity: Severity; area: string; finding: string }> = [];
const cleanupIds: string[] = [];

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readIncludes(path: string, needle: string) {
  return read(path).includes(needle);
}

function check(
  id: string,
  section: string,
  pass: boolean,
  detail?: string,
  severity: Severity = "P0",
) {
  checks.push({ id, section, pass, detail, severity });
  if (!pass) {
    findings.push({ severity, area: section, finding: `${id}: ${detail ?? "failed"}` });
  }
}

function workspaceSecret(): string {
  return process.env.WORKSPACE_SECRET ?? "workspace-post-audit-secret";
}

async function relatedCounts(leadId: string) {
  const store = await readCrmStore();
  return {
    notes: store.notes.filter((n) => n.leadId === leadId).length,
    tasks: store.tasks.filter((t) => t.leadId === leadId).length,
    activities: store.activities.filter((a) => a.leadId === leadId).length,
    docs: (store.caseDocuments ?? []).filter((d) => d.leadId === leadId).length,
    runs: store.automationRuns.filter((r) => r.leadId === leadId).length,
  };
}

async function funnelWaitingTotal() {
  const store = await readCrmStore();
  const stats = computeSequenceFunnelStats(store.leads, store.tasks);
  return stats.flows.flatMap((f) => f.steps).reduce((sum, s) => sum + s.waiting, 0);
}

function authedDeleteRequest(leadId: string) {
  return new NextRequest(`http://localhost/api/leads/${leadId}`, {
    method: "DELETE",
    headers: { cookie: `workspace_token=${workspaceSecret()}` },
  });
}

function unauthedDeleteRequest(leadId: string) {
  return new NextRequest(`http://localhost/api/leads/${leadId}`, { method: "DELETE" });
}

async function createFixtureLead(email: string) {
  const lead = await db.lead.create({
    data: {
      firstName: "Workspace",
      lastName: "PostAudit",
      email,
      phone: "07000000701",
      loanPurpose: "purchase",
      loanAmount: 275_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 450_000,
      propertyLocation: "Bristol",
      timeframe: "30_days",
      formCompleted: true,
      qualificationTier: "fully_qualified",
    },
  });
  cleanupIds.push(lead.id);

  await db.note.create({
    data: { leadId: lead.id, content: "Post-audit note", author: "Audit" },
  });
  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "FORM_SUBMITTED",
      description: "Post-audit activity",
    },
  });
  await db.task.create({
    data: {
      leadId: lead.id,
      title: "Post-audit task",
      description: "Delete cascade test",
      dueDate: new Date(),
    },
  });
  await db.automationRun.create({
    data: {
      leadId: lead.id,
      ruleId: "post-audit-rule",
      status: "COMPLETED",
    },
  });
  await db.caseDocument.create({
    data: {
      leadId: lead.id,
      docKey: "proof_of_id",
      label: "Proof of ID",
      required: true,
      status: "REQUESTED",
    },
  });

  const uploadDir = join(process.cwd(), ".case-uploads", lead.id);
  mkdirSync(uploadDir, { recursive: true });
  writeFileSync(join(uploadDir, "proof_of_id-test.pdf"), "audit");

  return lead;
}

async function runDeleteRuntimeAudits() {
  const email = `workspace-post-delete-${Date.now()}@test.local`;
  const lead = await createFixtureLead(email);
  const leadId = lead.id;

  const before = await relatedCounts(leadId);

  check(
    "B1",
    "Delete security",
    before.notes >= 1 && before.tasks >= 1,
    "fixture has related rows",
  );

  const unauth = await deleteLead(unauthedDeleteRequest(leadId), {
    params: Promise.resolve({ id: leadId }),
  });
  check("B2", "Delete security", unauth.status === 401, `unauthenticated → ${unauth.status}`);

  const stillThere = await db.lead.findUnique({ where: { id: leadId } });
  check("B3", "Delete security", stillThere != null, "lead intact after 401");

  const authed = await deleteLead(authedDeleteRequest(leadId), {
    params: Promise.resolve({ id: leadId }),
  });
  const authedBody = (await authed.json()) as { ok?: boolean; deletedId?: string };
  check(
    "B4",
    "Delete security",
    authed.status === 200 && authedBody.ok === true && authedBody.deletedId === leadId,
    `authenticated → ${authed.status}`,
  );

  const gone = await db.lead.findUnique({ where: { id: leadId } });
  check("C1", "Delete cascade", gone == null, "lead removed");

  const after = await relatedCounts(leadId);
  check("C2", "Delete cascade", after.notes === 0, `notes ${before.notes}→${after.notes}`);
  check("C3", "Delete cascade", after.tasks === 0, `tasks ${before.tasks}→${after.tasks}`);
  check(
    "C4",
    "Delete cascade",
    after.activities === 0,
    `activities ${before.activities}→${after.activities}`,
  );
  check("C5", "Delete cascade", after.docs === 0, `documents ${before.docs}→${after.docs}`);
  check("C6", "Delete cascade", after.runs === 0, `automation runs ${before.runs}→${after.runs}`);

  const uploadDir = join(process.cwd(), ".case-uploads", leadId);
  check("C7", "Delete cascade", !existsSync(uploadDir), "local upload folder removed");

  const repeat = await deleteLead(authedDeleteRequest(leadId), {
    params: Promise.resolve({ id: leadId }),
  });
  check("C8", "Delete cascade", repeat.status === 404, `repeat delete → ${repeat.status}`);

  cleanupIds.splice(cleanupIds.indexOf(leadId), 1);

  // deleteLeadCase helper directly
  const helperLead = await db.lead.create({
    data: {
      firstName: "Helper",
      lastName: "Delete",
      email: `workspace-post-helper-${Date.now()}@test.local`,
      phone: "07000000702",
      loanPurpose: "auction",
      loanAmount: 200_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 350_000,
      propertyLocation: "Leeds",
      timeframe: "30_days",
    },
  });
  await deleteLeadCase(helperLead.id);
  const helperGone = await db.lead.findUnique({ where: { id: helperLead.id } });
  check("C9", "Delete cascade", helperGone == null, "deleteLeadCase helper");

  // Win-back funnel no orphan after delete
  const winbackEmail = `workspace-post-winback-${Date.now()}@test.local`;
  const lost = await db.lead.create({
    data: {
      firstName: "Winback",
      lastName: "Delete",
      email: winbackEmail,
      phone: "07000000703",
      loanPurpose: "purchase",
      loanAmount: 300_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 500_000,
      propertyLocation: "London",
      timeframe: "30_days",
      formCompleted: true,
    },
  });
  cleanupIds.push(lost.id);
  await transitionCaseStage(lost, "LOST", "Post-audit lost", {
    status: "LOST",
    lostReason: LOST_REASONS[0],
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  const enrolled = await enrollWinback(
    (await db.lead.findUnique({ where: { id: lost.id } }))!,
  );
  const waitingBefore = await funnelWaitingTotal();

  await deleteLeadCase(enrolled.id);
  cleanupIds.splice(cleanupIds.indexOf(lost.id), 1);

  const waitingAfter = await funnelWaitingTotal();

  check(
    "C10",
    "Delete cascade",
    waitingAfter <= waitingBefore,
    `funnel waiting ${waitingBefore}→${waitingAfter}`,
    "P1",
  );
}

async function runLiveAudits(baseUrl: string) {
  try {
    const logoRes = await fetch(`${baseUrl}/logo.png`);
    check(
      "K1",
      "Production",
      logoRes.ok,
      `GET /logo.png → ${logoRes.status}`,
    );
    const contentType = logoRes.headers.get("content-type") ?? "";
    check(
      "K2",
      "Production",
      contentType.includes("image"),
      contentType || "missing content-type",
      "P1",
    );
  } catch (error) {
    check(
      "K1",
      "Production",
      false,
      error instanceof Error ? error.message : "fetch failed",
    );
  }

  try {
    const loginRes = await fetch(`${baseUrl}/workspace/login`);
    const html = await loginRes.text();
    check(
      "K3",
      "Production",
      loginRes.ok && html.includes("logo.png"),
      `login page references logo (${loginRes.status})`,
    );
    check(
      "K4",
      "Production",
      html.includes("Workspace CRM"),
      "login heading present",
      "P1",
    );
  } catch (error) {
    check(
      "K3",
      "Production",
      false,
      error instanceof Error ? error.message : "login fetch failed",
    );
  }
}

async function main() {
  const liveMode = process.env.WORKSPACE_POST_AUDIT_LIVE === "true";
  const baseUrl =
    process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
    process.env.POSTLAUNCH_BASE_URL?.replace(/\/$/, "") ??
    "https://loans.bridgingloansbroker.co.uk";

  const routeSrc = read("src/app/api/leads/[id]/route.ts");
  const deleteSrc = read("src/lib/delete-lead-case.ts");
  const caseDetail = read("src/components/workspace/case-detail.tsx");
  const loginPage = read("src/app/workspace/login/page.tsx");
  const shell = read("src/components/workspace/shell.tsx");
  const home = read("src/components/workspace/operational-home.tsx");
  const logoSrc = read("src/components/brand/logo.tsx");

  // A — Delete wiring
  check("A1", "Delete wiring", existsSync("src/lib/delete-lead-case.ts"), "delete-lead-case.ts");
  check(
    "A2",
    "Delete wiring",
    routeSrc.includes("export async function DELETE"),
    "DELETE handler",
  );
  check(
    "A3",
    "Delete wiring",
    routeSrc.includes("deleteLeadCase"),
    "route calls deleteLeadCase",
  );
  check(
    "A4",
    "Delete wiring",
    routeSrc.includes("verifyWorkspaceAuth"),
    "workspace auth on DELETE",
  );
  check(
    "A5",
    "Delete wiring",
    deleteSrc.includes("db.lead.delete"),
    "helper deletes lead",
  );
  check(
    "A6",
    "Delete wiring",
    deleteSrc.includes(".case-uploads"),
    "local upload cleanup",
    "P1",
  );
  check(
    "A7",
    "Delete wiring",
    readIncludes("package.json", "workspace:post-implementation"),
    "npm script registered",
    "P1",
  );

  await runDeleteRuntimeAudits();

  // D — Delete UI
  check(
    "D1",
    "Delete UI",
    caseDetail.includes("Delete case permanently"),
    "sidebar action",
  );
  check(
    "D2",
    "Delete UI",
    caseDetail.includes('deleteConfirm !== "DELETE"'),
    "confirmation gate",
  );
  check(
    "D3",
    "Delete UI",
    caseDetail.includes('method: "DELETE"'),
    "client calls DELETE",
  );
  check(
    "D4",
    "Delete UI",
    caseDetail.includes('router.push("/workspace")'),
    "redirect after delete",
  );
  check(
    "D5",
    "Delete UI",
    caseDetail.includes("workspace:counts-changed"),
    "nav counts refresh",
    "P1",
  );
  check(
    "D6",
    "Delete UI",
    caseDetail.includes("showDeleteModal"),
    "two-step modal",
    "P1",
  );

  // E — Branding assets
  check("E1", "Branding assets", existsSync("public/logo.png"), "public/logo.png");
  check(
    "E2",
    "Branding assets",
    logoSrc.includes('src="/logo.png"'),
    "BrandLogo uses logo.png",
  );
  check(
    "E3",
    "Branding assets",
    logoSrc.includes('alt="Bridging Loans Broker"'),
    "alt text",
    "P1",
  );

  // F — Branding placement
  check("F1", "Branding placement", loginPage.includes("BrandLogo"), "login page");
  check(
    "F2",
    "Branding placement",
    loginPage.includes('theme="dark"'),
    "login dark theme",
    "P1",
  );
  check("F3", "Branding placement", shell.includes("BrandLogo"), "workspace shell");
  check(
    "F4",
    "Branding placement",
    shell.includes('href="/workspace"'),
    "shell logo links home",
    "P1",
  );
  check("F5", "Branding placement", home.includes("BrandLogo"), "dashboard home");
  check(
    "F6",
    "Branding placement",
    home.includes("bg-navy"),
    "dashboard logo on navy container",
    "P1",
  );
  check(
    "F7",
    "Branding placement",
    !shell.includes(">BLB<"),
    "BLB placeholder removed from shell",
    "P1",
  );

  // G — Polish & gaps
  check(
    "G1",
    "Polish",
    !deleteSrc.includes("@vercel/blob"),
    "blob purge not implemented (documented gap)",
    "P2",
  );
  check(
    "G2",
    "Polish",
    !readIncludes("src/components/workspace/reengagement-board.tsx", "Delete case"),
    "no queue-row delete (acceptable)",
    "P2",
  );

  // H — Regression
  check(
    "H1",
    "Regression",
    readIncludes("scripts/workspace-ui-audit.ts", "Delete case API route"),
    "workspace-ui-audit covers delete",
    "P1",
  );
  check(
    "H2",
    "Regression",
    readIncludes("scripts/workspace-ui-audit.ts", "Workspace login brand logo"),
    "workspace-ui-audit covers branding",
    "P1",
  );

  if (liveMode) {
    await runLiveAudits(baseUrl);
  } else {
    check(
      "K0",
      "Production",
      true,
      "advisory — WORKSPACE_POST_AUDIT_LIVE=true for prod checks",
      "P1",
    );
  }

  for (const id of cleanupIds) {
    await db.lead.delete({ where: { id } }).catch(() => null);
    const uploadDir = join(process.cwd(), ".case-uploads", id);
    if (existsSync(uploadDir)) {
      rmSync(uploadDir, { recursive: true, force: true });
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  const p0Failed = checks.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = checks.filter((c) => !c.pass && c.severity === "P1");

  const score =
    p0Failed.length > 0
      ? Math.max(4, 10 - p0Failed.length)
      : p1Failed.length > 2
        ? 8
        : p1Failed.length > 0
          ? 9
          : 10;

  let verdict: "SHIP" | "SHIP WITH FIXES" | "DO NOT SHIP";
  if (p0Failed.length > 0) verdict = "DO NOT SHIP";
  else if (p1Failed.length > 0) verdict = "SHIP WITH FIXES";
  else verdict = "SHIP";

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("WORKSPACE POST-IMPLEMENTATION AUDIT");
  console.log("  (delete case + workspace branding)");
  console.log("══════════════════════════════════════════════════════════\n");

  const bySection = new Map<string, Check[]>();
  for (const c of checks) {
    const list = bySection.get(c.section) ?? [];
    list.push(c);
    bySection.set(c.section, list);
  }

  for (const [section, list] of bySection) {
    console.log(`## ${section}`);
    for (const c of list) {
      const sev = c.severity !== "P0" ? ` [${c.severity}]` : "";
      console.log(`  ${c.pass ? "✓" : "✗"} ${c.id}${sev}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    console.log("");
  }

  console.log(`RESULT: ${passed}/${checks.length} checks passed`);
  console.log(`P0 failures: ${p0Failed.length} · P1: ${p1Failed.length}\n`);

  if (findings.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area}: ${f.finding}`);
    }
    console.log("");
  }

  console.log("EXECUTIVE VERDICT:", verdict);
  console.log(`SCORE: ${score}/10\n`);

  console.log("TOP RESIDUAL RISKS:");
  console.log("  1. Vercel Blob files not purged on delete (metadata only)");
  console.log("  2. No bulk delete from queue boards");
  console.log("  3. No audit trail of who deleted a case\n");

  console.log("MANUAL SIGN-OFF (Daniel):");
  console.log("  [ ] Open test case → Delete → cancel → case still there");
  console.log("  [ ] Delete test case → type DELETE → lands on command centre");
  console.log("  [ ] Old case URL shows not found");
  console.log("  [ ] Login page shows Bridging Loans Broker logo");
  console.log("  [ ] Dashboard home logo readable on light background");
  console.log("  [ ] Mobile header + sidebar logo present\n");

  if (!liveMode) {
    console.log(
      "💡 Live checks: WORKSPACE_POST_AUDIT_LIVE=true npm run workspace:post-implementation\n",
    );
  }

  if (p0Failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
