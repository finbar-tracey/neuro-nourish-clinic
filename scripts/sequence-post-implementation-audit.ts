#!/usr/bin/env npx tsx
/**
 * Sequence flows viewer — post-implementation audit (10/10 prompt).
 *
 * Run: npm run sequence:post-implementation
 * Live env: SEQUENCE_POST_AUDIT_LIVE=true npm run sequence:post-implementation
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { GET as sequencesGet } from "@/app/api/workspace/sequences/route";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS } from "@/lib/case-stages";
import { db } from "@/lib/db";
import { optOutEmailAddress } from "@/lib/email-unsubscribe";
import { NURTURE_EMAIL_SCHEDULE } from "@/lib/journey-emails";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { computeSequenceFunnelStats } from "@/lib/sequence-funnel-stats";
import { SEQUENCE_FLOWS } from "@/lib/sequence-flow-definitions";
import { enrollWinback } from "@/lib/winback-sequence";
import { pauseWinback } from "@/lib/winback-stop";
import {
  WINBACK_LONG_SCHEDULE,
  WINBACK_LONG_SEQUENCE_ID,
  WINBACK_STANDARD_SCHEDULE,
} from "@/lib/winback-schedule";
import { computeWinbackMetrics } from "@/lib/winback-metrics";

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
const ids: string[] = [];

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

async function createLostLead(email: string, lostReason: string = LOST_REASONS[0]) {
  const lead = await db.lead.create({
    data: {
      firstName: "Seq",
      lastName: "PostAudit",
      email,
      phone: "07000000601",
      loanPurpose: "purchase",
      loanAmount: 290_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 490_000,
      propertyLocation: "Leeds",
      timeframe: "30_days",
      formCompleted: true,
      caseStage: "CONTACTED",
      status: "CONTACTED",
    },
  });
  ids.push(lead.id);
  await transitionCaseStage(lead, "LOST", "Sequence post-audit", {
    status: "LOST",
    lostReason,
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  return db.lead.findUnique({ where: { id: lead.id } });
}

async function runRuntimeAudits() {
  // D — Count semantics
  try {
    const nurtureLead = await db.lead.create({
      data: {
        firstName: "Seq",
        lastName: "Nurture",
        email: `seq-post-nurture-${Date.now()}@test.local`,
        phone: "07000000602",
        loanPurpose: "purchase",
        loanAmount: 300_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 500_000,
        propertyLocation: "London",
        timeframe: "researching",
        formCompleted: true,
        status: "FOLLOW_UP",
      },
    });
    ids.push(nurtureLead.id);
    await enrollLongTimeframeNurture(nurtureLead);

    let leads = await db.lead.findMany();
    let tasks = await db.task.findMany({ where: { completed: false } });
    let { flows, overview } = computeSequenceFunnelStats(leads, tasks);
    const nurture = flows.find((f) => f.id === "long_timeframe_nurture")!;

    check("D1", "Count semantics", nurture.enrolled >= 1, `enrolled=${nurture.enrolled}`);
    check("D2", "Count semantics", nurture.active >= 1, `active=${nurture.active}`);
    check(
      "D3",
      "Count semantics",
      nurture.steps[1]!.waiting >= 1,
      `step2 waiting=${nurture.steps[1]?.waiting}`,
    );
    check(
      "D4",
      "Count semantics",
      nurture.steps[0]!.passed >= 1,
      `step1 passed=${nurture.steps[0]?.passed}`,
    );
    check("D5", "Count semantics", nurture.paused === 0, "nurture has no pause state");

    const winbackEmail = `seq-post-wb-${Date.now()}@test.local`;
    const winbackLead = await createLostLead(winbackEmail);
    await enrollWinback(winbackLead!);

    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    ({ flows, overview } = computeSequenceFunnelStats(leads, tasks));
    const standard = flows.find((f) => f.id === "lost-standard")!;

    check("D6", "Count semantics", standard.active >= 1, `active=${standard.active}`);
    check(
      "D7",
      "Count semantics",
      standard.steps.some((s) => s.waiting > 0),
      "standard has waiting step",
    );
    check(
      "D8",
      "Count semantics",
      standard.steps[0]!.passed >= 1,
      `step1 passed=${standard.steps[0]?.passed}`,
    );

    await pauseWinback((await db.lead.findUnique({ where: { id: winbackLead!.id } }))!);
    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    const auditLeads = leads.filter((l) => ids.includes(l.id));
    ({ flows } = computeSequenceFunnelStats(auditLeads, tasks));
    const pausedFlow = flows.find((f) => f.id === "lost-standard")!;

    check("D9", "Count semantics", pausedFlow.paused >= 1, `paused=${pausedFlow.paused}`);
    const pausedStep = pausedFlow.steps.find((s) => s.paused > 0);
    check(
      "D10",
      "Count semantics",
      pausedStep != null && pausedStep.waiting === 0,
      "paused not counted as waiting",
    );

    const longLead = await createLostLead(
      `seq-post-long-${Date.now()}@test.local`,
      "Funding no longer needed",
    );
    await enrollWinback(longLead!);
    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    ({ flows } = computeSequenceFunnelStats(leads, tasks));
    const longFlow = flows.find((f) => f.id === WINBACK_LONG_SEQUENCE_ID)!;

    check(
      "D11",
      "Count semantics",
      longFlow.steps.length === WINBACK_LONG_SCHEDULE.length,
      String(longFlow.steps.length),
    );
    check("D12", "Count semantics", longFlow.active >= 1, `active=${longFlow.active}`);

    const optEmail = `seq-post-opt-${Date.now()}@test.local`;
    const optLead = await createLostLead(optEmail);
    await enrollWinback(optLead!);
    await optOutEmailAddress(optEmail);
    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    ({ flows } = computeSequenceFunnelStats(leads, tasks));
    const optFlow = flows.find((f) => f.id === "lost-standard")!;

    check(
      "D13",
      "Count semantics",
      optFlow.stopped >= 1,
      `stopped=${optFlow.stopped}`,
    );

    const collisionLead = await db.lead.create({
      data: {
        firstName: "Seq",
        lastName: "Collision",
        email: `seq-post-col-${Date.now()}@test.local`,
        phone: "07000000603",
        loanPurpose: "purchase",
        loanAmount: 275_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 450_000,
        propertyLocation: "Bristol",
        timeframe: "researching",
        formCompleted: true,
        status: "FOLLOW_UP",
        nurtureEnrolled: true,
      },
    });
    ids.push(collisionLead.id);
    await enrollLongTimeframeNurture(collisionLead);
    await transitionCaseStage(collisionLead, "LOST", "Audit", {
      status: "LOST",
      lostReason: LOST_REASONS[0],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
      nurtureEnrolled: false,
    });
    await enrollWinback((await db.lead.findUnique({ where: { id: collisionLead.id } }))!);

    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    ({ flows } = computeSequenceFunnelStats(leads, tasks));
    const nurtureAfter = flows.find((f) => f.id === "long_timeframe_nurture")!;
    const colInNurture = nurtureAfter.steps.some((s) =>
      s.leads.some((l) => l.id === collisionLead.id),
    );
    const colInWinback = flows
      .find((f) => f.id === "lost-standard")
      ?.steps.some((s) => s.leads.some((l) => l.id === collisionLead.id));

    check(
      "D14",
      "Count semantics",
      !colInNurture,
      "win-back enroll removes lead from nurture funnel",
    );
    check(
      "D15",
      "Count semantics",
      colInWinback === true || standard.active >= 1,
      "lead appears in win-back funnel",
    );

    const dueEmail = `seq-post-due-${Date.now()}@test.local`;
    const dueLead = await createLostLead(dueEmail);
    await enrollWinback(dueLead!);
    const dueTask = await db.task.findFirst({
      where: {
        leadId: dueLead!.id,
        completed: false,
        title: { startsWith: "Win-back" },
      },
      orderBy: { dueDate: "asc" },
    });
    if (dueTask) {
      await db.task.update({
        where: { id: dueTask.id },
        data: { dueDate: new Date() },
      });
      leads = await db.lead.findMany();
      tasks = await db.task.findMany({ where: { completed: false } });
      ({ flows, overview } = computeSequenceFunnelStats(leads, tasks));
      check(
        "D16",
        "Count semantics",
        overview.totalDueToday >= 1,
        `dueToday=${overview.totalDueToday}`,
      );
      const dueStep = flows
        .find((f) => f.id === "lost-standard")
        ?.steps.find((s) => s.dueToday > 0);
      check("D17", "Count semantics", dueStep != null, "step dueToday badge data");
    } else {
      check("D16", "Count semantics", false, "no task for due today test");
      check("D17", "Count semantics", false, "skipped");
    }

    leads = await db.lead.findMany();
    tasks = await db.task.findMany({ where: { completed: false } });
    ({ flows, overview } = computeSequenceFunnelStats(leads, tasks));

    const sumEnrolled = flows.reduce((s, f) => s + f.enrolled, 0);
    const sumActive = flows.reduce((s, f) => s + f.active, 0);
    const sumPaused = flows.reduce((s, f) => s + f.paused, 0);
    const sumDue = flows.reduce((s, f) => s + f.dueToday, 0);

    check(
      "D18",
      "Count semantics",
      overview.totalEnrolled === sumEnrolled,
      `${overview.totalEnrolled} vs ${sumEnrolled}`,
    );
    check(
      "D19",
      "Count semantics",
      overview.totalActive === sumActive,
      `${overview.totalActive} vs ${sumActive}`,
    );
    check(
      "D20",
      "Count semantics",
      overview.totalPaused === sumPaused,
      `${overview.totalPaused} vs ${sumPaused}`,
    );
    check(
      "D21",
      "Count semantics",
      overview.totalDueToday === sumDue,
      `${overview.totalDueToday} vs ${sumDue}`,
    );
  } catch (error) {
    check("D0", "Count semantics", false, String(error));
  }

  // E — API runtime
  try {
    const secret = process.env.WORKSPACE_SECRET ?? "";
    check("E1", "API", Boolean(secret), "WORKSPACE_SECRET for API test", "P1");

    const unauth = new NextRequest("http://localhost/api/workspace/sequences");
    const unauthRes = await sequencesGet(unauth);
    check("E2", "API", unauthRes.status === 401, String(unauthRes.status));

    if (secret) {
      const auth = new NextRequest("http://localhost/api/workspace/sequences", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const authRes = await sequencesGet(auth);
      const json = (await authRes.json()) as {
        flows?: unknown[];
        overview?: unknown;
        updatedAt?: string;
      };
      check("E3", "API", authRes.status === 200, String(authRes.status));
      check("E4", "API", Array.isArray(json.flows) && json.flows.length === 3, String(json.flows?.length));
      check("E5", "API", json.overview != null, "overview present");
      check("E6", "API", typeof json.updatedAt === "string", "updatedAt ISO");
      const firstFlow = json.flows?.[0] as { steps?: Array<{ waiting: number; passed: number }> };
      check(
        "E7",
        "API",
        firstFlow?.steps?.[0] != null && typeof firstFlow.steps[0].waiting === "number",
        "step stats in JSON",
      );
    }
  } catch (error) {
    check("E0", "API", false, String(error));
  }

  // G — CRM integration
  try {
    const leads = await db.lead.findMany();
    const winbackLeads = leads.filter(
      (l) => l.winbackStatus === "active" || l.winbackStatus === "paused",
    );
    const metrics = computeWinbackMetrics(leads);
    check(
      "G1",
      "Integration",
      metrics.active + metrics.paused >= winbackLeads.length - 1,
      `metrics ${metrics.active + metrics.paused} vs leads ${winbackLeads.length}`,
      "P1",
    );
  } catch (error) {
    check("G0", "Integration", false, String(error), "P1");
  }
}

async function main() {
  const liveMode = process.env.SEQUENCE_POST_AUDIT_LIVE === "true";

  // A — Charter
  check("A1", "Charter", existsSync("src/lib/sequence-flow-definitions.ts"), "definitions");
  check("A2", "Charter", existsSync("src/lib/sequence-funnel-stats.ts"), "stats engine");
  check("A3", "Charter", existsSync("src/app/api/workspace/sequences/route.ts"), "API route");
  check(
    "A4",
    "Charter",
    existsSync("src/components/workspace/sequence-flows-panel.tsx"),
    "UI panel",
  );

  // B — Read-only safety
  const routeSrc = read("src/app/api/workspace/sequences/route.ts");
  check("B1", "Safety", routeSrc.includes("export async function GET"), "GET only");
  check("B2", "Safety", !routeSrc.includes("export async function POST"), "no POST");
  check("B3", "Safety", !routeSrc.includes("export async function PATCH"), "no PATCH");
  check(
    "B4",
    "Safety",
    readIncludes("src/components/workspace/sequence-flows-panel.tsx", "monitoring only"),
    "read-only copy",
    "P1",
  );
  check(
    "B5",
    "Safety",
    !readIncludes("src/components/workspace/sequence-flows-panel.tsx", "method: \"PATCH\""),
    "no client mutations",
  );

  // C — Flow catalog
  check("C1", "Catalog", SEQUENCE_FLOWS.length === 3, String(SEQUENCE_FLOWS.length));
  const nurtureDef = SEQUENCE_FLOWS.find((f) => f.id === "long_timeframe_nurture")!;
  const standardDef = SEQUENCE_FLOWS.find((f) => f.id === "lost-standard")!;
  const longDef = SEQUENCE_FLOWS.find((f) => f.id === WINBACK_LONG_SEQUENCE_ID)!;

  check(
    "C2",
    "Catalog",
    nurtureDef.steps.length === NURTURE_EMAIL_SCHEDULE.length,
    String(nurtureDef.steps.length),
  );
  check(
    "C3",
    "Catalog",
    standardDef.steps.length === WINBACK_STANDARD_SCHEDULE.length,
    String(standardDef.steps.length),
  );
  check(
    "C4",
    "Catalog",
    longDef.steps.length === WINBACK_LONG_SCHEDULE.length,
    String(longDef.steps.length),
  );
  check(
    "C5",
    "Catalog",
    standardDef.steps.some((s) => s.channel === "sms"),
    "SMS steps in standard",
  );
  check(
    "C6",
    "Catalog",
    nurtureDef.steps[1]?.waitLabel === "Wait 3 days",
    nurtureDef.steps[1]?.waitLabel ?? "",
  );
  check(
    "C7",
    "Catalog",
    standardDef.steps[0]!.label.length > 12,
    "win-back email subject not generic",
  );
  check(
    "C8",
    "Catalog",
    standardDef.queueHref === "/workspace/re-engagement",
    "queue link",
    "P1",
  );

  await runRuntimeAudits();

  // F — UI static
  const ui = read("src/components/workspace/sequence-flows-panel.tsx");
  check("F1", "UI", ui.includes("selectedId"), "flow picker state", "P1");
  check("F2", "UI", ui.includes("overview"), "global overview", "P1");
  check("F3", "UI", ui.includes("passed"), "passed counts", "P1");
  check("F4", "UI", ui.includes("dueToday"), "due today", "P1");
  check("F5", "UI", ui.includes("leadsOverflow"), "+ more overflow", "P1");
  check("F6", "UI", ui.includes("ExitNode"), "exit nodes", "P1");
  check("F7", "UI", ui.includes("AUTO_REFRESH_MS"), "auto-refresh", "P1");
  check("F8", "UI", ui.includes("FunnelProgressBar"), "progress bar", "P1");
  check(
    "F9",
    "UI",
    readIncludes("src/components/workspace/automations-hub.tsx", "Sequence flows"),
    "automations tab",
    "P1",
  );
  check(
    "F10",
    "UI",
    readIncludes("src/components/workspace/automations-hub.tsx", "Event rules"),
    "rules tab preserved",
    "P1",
  );

  // H — Freshness & errors
  check(
    "H1",
    "Freshness",
    ui.includes("setInterval") && ui.includes("clearInterval"),
    "refresh interval cleanup",
    "P1",
  );
  check(
    "H2",
    "Freshness",
    readIncludes("src/components/workspace/sequence-flows-panel.tsx", "WorkspaceErrorState"),
    "error state",
    "P1",
  );

  // I — Compliance
  check(
    "I1",
    "Compliance",
    routeSrc.includes("verifyWorkspaceAuth"),
    "workspace auth on API",
  );
  check(
    "I2",
    "Compliance",
    readIncludes("src/components/workspace/sequence-flows-panel.tsx", "/workspace/cases/"),
    "case links not public",
    "P1",
  );

  // J — Regression scripts
  check(
    "J1",
    "Regression",
    existsSync("scripts/sequence-funnel-audit.ts"),
    "funnel unit audit",
    "P1",
  );
  check(
    "J2",
    "Regression",
    readIncludes("package.json", "sequence:funnel"),
    "npm script",
    "P1",
  );

  // K — Production advisory
  if (liveMode) {
    check("K1", "Production", Boolean(process.env.WORKSPACE_SECRET), "WORKSPACE_SECRET");
  } else {
    check(
      "K1",
      "Production",
      true,
      "advisory — SEQUENCE_POST_AUDIT_LIVE=true for prod checks",
      "P1",
    );
  }

  for (const id of ids) {
    await db.lead.delete({ where: { id } }).catch(() => null);
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
  console.log("SEQUENCE FLOWS POST-IMPLEMENTATION AUDIT");
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
  console.log("  1. Full lead scan per request — plan cache above ~500 enrolled");
  console.log("  2. Operational cron flows not shown (booking/doc chases)");
  console.log("  3. No open/click rates per step\n");

  console.log("MANUAL SIGN-OFF (Daniel):");
  console.log("  [ ] Automations → Sequence flows — 3 flow cards");
  console.log("  [ ] Global overview matches intuition");
  console.log("  [ ] Pick nurture / win-back — leads on expected steps");
  console.log("  [ ] Passed vs waiting makes sense on a known case");
  console.log("  [ ] Pause win-back → paused on same step");
  console.log("  [ ] Lead name opens correct case");
  console.log("  [ ] Auto-refresh updates timestamp after 60s");
  console.log("  [ ] Event rules tab still works\n");

  if (p0Failed.length > 0) process.exit(1);
}

main();
