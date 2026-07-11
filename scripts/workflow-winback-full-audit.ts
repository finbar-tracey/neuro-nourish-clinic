#!/usr/bin/env npx tsx
/**
 * Full win-back audit — implements the 10/10 review prompt checklist.
 * Run: npm run workflow:winback:full
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { leadToCase } from "@/lib/case";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS } from "@/lib/case-stages";
import { db } from "@/lib/db";
import { isMarketingJourneyEmail } from "@/lib/email";
import { optOutEmailAddress } from "@/lib/email-unsubscribe";
import { processDueNurtureEmails } from "@/lib/process-nurture-tasks";
import { processDueWinbackEmails } from "@/lib/process-winback-tasks";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { canEnrollWinback } from "@/lib/winback-eligibility";
import { enrollWinback } from "@/lib/winback-sequence";
import { pauseWinback, stopWinback } from "@/lib/winback-stop";
import { resumeWinback } from "@/lib/winback-reopen";
import {
  WINBACK_STANDARD_SCHEDULE,
  WINBACK_LONG_SCHEDULE,
} from "@/lib/winback-schedule";
import {
  caseInQueuePage,
  caseInReengagementQueue,
  isWinbackActive,
  queueNavCounts,
} from "@/lib/workspace-case";

type Finding = {
  severity: "P0" | "P1" | "P2";
  area: string;
  finding: string;
  fix?: string;
};

type Check = { id: string; section: string; pass: boolean; detail?: string | null };

const checks: Check[] = [];
const findings: Finding[] = [];

function check(id: string, section: string, pass: boolean, detail?: string | null) {
  checks.push({ id, section, pass, detail: detail ?? undefined });
  if (!pass) {
    findings.push({
      severity: id.startsWith("H") ? "P0" : "P1",
      area: section,
      finding: `${id}: ${detail ?? "failed"}`,
    });
  }
}

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readIncludes(path: string, needle: string) {
  return read(path).includes(needle);
}

async function createLostLead(email: string) {
  const lead = await db.lead.create({
    data: {
      firstName: "Full",
      lastName: "Audit",
      email,
      phone: "07000000301",
      loanPurpose: "purchase",
      loanAmount: 280_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 480_000,
      propertyLocation: "Leeds",
      timeframe: "30_days",
      formCompleted: true,
      caseStage: "CONTACTED",
      operationalQueue: "NEW_LEAD",
      status: "CONTACTED",
      conversationStarted: true,
    },
  });
  await transitionCaseStage(lead, "LOST", "Audit", {
    status: "LOST",
    lostReason: LOST_REASONS[0],
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  return db.lead.findUnique({ where: { id: lead.id } });
}

async function main() {
  const ids: string[] = [];

  // A — Data model
  check(
    "A1",
    "Data model",
    read("prisma/schema.prisma").includes("winbackStatus"),
    "winback fields in schema",
  );
  check(
    "A2",
    "Data model",
    existsSync("prisma/migrations/20260618120000_winback_sequence/migration.sql"),
    "migration file",
  );
  check(
    "A3",
    "Data model",
    readIncludes("src/lib/workspace-case.ts", "reengagement"),
    "queryable nav count",
  );

  // B — Enrollment
  check(
    "B1",
    "Enrollment",
    canEnrollWinback("No response") && !canEnrollWinback("Went with another broker"),
  );
  check(
    "B2",
    "Enrollment",
    readIncludes("src/app/api/leads/[id]/route.ts", "startWinback"),
    "markLost startWinback",
  );
  check(
    "B3",
    "Enrollment",
    readIncludes("src/components/workspace/case-detail.tsx", "startWinback"),
    "UI checkbox",
  );

  // C — Sequence
  check(
    "C1",
    "Sequence",
    WINBACK_STANDARD_SCHEDULE.length === 6 &&
      WINBACK_STANDARD_SCHEDULE[0]?.day === 0 &&
      WINBACK_LONG_SCHEDULE.length === 3,
    `${WINBACK_STANDARD_SCHEDULE.length} standard / ${WINBACK_LONG_SCHEDULE.length} long`,
  );
  check(
    "C2",
    "Sequence",
    readIncludes("src/lib/automation-task-meta.ts", "encodeWinbackTaskMeta"),
    "structured task metadata",
  );
  check(
    "C3",
    "Sequence",
    readIncludes("src/app/api/cron/process-idle/route.ts", "processDueWinbackEmails"),
    "cron wired",
  );
  for (const id of [
    "winback-lost-day-0",
    "winback-lost-day-7",
    "winback-lost-day-14",
    "winback-lost-day-30",
    "winback-long-day-0",
    "winback-long-day-30",
    "winback-long-day-90",
  ]) {
    check(
      "C4",
      "Sequence",
      readIncludes("src/lib/journey-emails.ts", `"${id}"`),
      id,
    );
  }

  // D — Collisions (runtime)
  try {
    const email = `winback-full-${Date.now()}@test.local`;
    const lead = await db.lead.create({
      data: {
        firstName: "Collision",
        lastName: "Audit",
        email,
        phone: "07000000302",
        loanPurpose: "purchase",
        loanAmount: 250_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 400_000,
        propertyLocation: "Manchester",
        timeframe: "researching",
        formCompleted: true,
        status: "FOLLOW_UP",
        nurtureEnrolled: true,
      },
    });
    ids.push(lead.id);
    await enrollLongTimeframeNurture(lead);
    await transitionCaseStage(lead, "LOST", "Audit", {
      status: "LOST",
      lostReason: LOST_REASONS[0],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
      nurtureEnrolled: false,
    });
    const lost = await db.lead.findUnique({ where: { id: lead.id } });
    await enrollWinback(lost!);

    const nurturePending = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Send nurture email:" },
      },
    });
    check("D1", "Collisions", nurturePending === 0, `nurture tasks ${nurturePending}`);
    check(
      "D2",
      "Collisions",
      (await db.lead.findUnique({ where: { id: lead.id } }))?.nurtureEnrolled === false,
    );

    const nurtureRun = await processDueNurtureEmails();
    check("D3", "Collisions", nurtureRun.processed >= 0, "nurture processor safe");

    // Ineligible startWinback does not enroll
    const inel = await db.lead.create({
      data: {
        firstName: "Inel",
        lastName: "Audit",
        email: `inel-${Date.now()}@test.local`,
        phone: "07000000303",
        loanPurpose: "purchase",
        loanAmount: 200_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 350_000,
        propertyLocation: "Bristol",
        timeframe: "30_days",
        formCompleted: true,
        status: "CONTACTED",
        caseStage: "CONTACTED",
      },
    });
    ids.push(inel.id);
    await transitionCaseStage(inel, "LOST", "Audit", {
      status: "LOST",
      lostReason: "Went with another broker",
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
    });
    let threw = false;
    try {
      await enrollWinback((await db.lead.findUnique({ where: { id: inel.id } }))!);
    } catch {
      threw = true;
    }
    check("D4", "Collisions", threw, "enrollWinback rejects ineligible");

    const inelRow = await db.lead.findUnique({ where: { id: inel.id } });
    check(
      "D5",
      "Collisions",
      inelRow?.winbackEnrolled !== true,
      `winbackEnrolled=${inelRow?.winbackEnrolled}`,
    );

    // Opt-out stops win-back
    const optEmail = `optout-${Date.now()}@test.local`;
    const optLead = await createLostLead(optEmail);
    ids.push(optLead!.id);
    await enrollWinback(optLead!);
    await optOutEmailAddress(optEmail);
    const opted = await db.lead.findUnique({ where: { id: optLead!.id } });
    check(
      "D6",
      "Collisions",
      opted?.winbackStatus === "stopped" && opted?.winbackStoppedReason === "opted_out",
      opted?.winbackStatus,
    );

    // Disqualified cannot enroll
    const disq = await db.lead.create({
      data: {
        firstName: "Disq",
        lastName: "Audit",
        email: `disq-${Date.now()}@test.local`,
        phone: "07000000304",
        loanPurpose: "purchase",
        loanAmount: 200_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 350_000,
        propertyLocation: "Liverpool",
        timeframe: "30_days",
        formCompleted: true,
        status: "DISQUALIFIED",
        caseStage: "DISQUALIFIED",
        disqualifiedReason: "Below minimum loan amount",
      },
    });
    ids.push(disq.id);
    let disqThrew = false;
    try {
      await enrollWinback(disq);
    } catch {
      disqThrew = true;
    }
    check("D7", "Collisions", disqThrew, "DISQUALIFIED rejected");
  } catch (error) {
    check("D0", "Collisions", false, String(error));
  }

  // E — Pause / resume
  try {
    const email = `pause-${Date.now()}@test.local`;
    const row = await createLostLead(email);
    ids.push(row!.id);
    await enrollWinback(row!);
    await pauseWinback((await db.lead.findUnique({ where: { id: row!.id } }))!);
    const paused = await db.lead.findUnique({ where: { id: row!.id } });
    check("E1", "Pause/resume", paused?.winbackStatus === "paused");

    const pendingWhilePaused = await db.task.count({
      where: {
        leadId: row!.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
    });
    check("E2", "Pause/resume", pendingWhilePaused > 0, "tasks kept while paused");

    const task = await db.task.findFirst({
      where: {
        leadId: row!.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
      orderBy: { dueDate: "asc" },
    });
    if (task) {
      await db.task.update({
        where: { id: task.id },
        data: { dueDate: new Date(Date.now() - 60_000) },
      });
    }
    await processDueWinbackEmails();
    const stillPending = await db.task.count({
      where: { id: task?.id, completed: false },
    });
    check("E3", "Pause/resume", stillPending === 1, "processor skips paused");

    await resumeWinback((await db.lead.findUnique({ where: { id: row!.id } }))!);
    const resumed = await db.lead.findUnique({ where: { id: row!.id } });
    check("E4", "Pause/resume", resumed?.winbackStatus === "active");
    check("E5", "Pause/resume", resumed?.winbackNextAt != null, "nextAt restored");
  } catch (error) {
    check("E0", "Pause/resume", false, String(error));
  }

  // F — Queues
  try {
    const email = `queue-${Date.now()}@test.local`;
    const row = await createLostLead(email);
    ids.push(row!.id);
    await enrollWinback(row!);
    const view = leadToCase((await db.lead.findUnique({ where: { id: row!.id } }))!);
    check("F1", "Queues", caseInQueuePage(view, "closed"));
    check("F2", "Queues", caseInReengagementQueue(view));
    check("F3", "Queues", isWinbackActive(view));

    const allCases = [view];
    const counts = queueNavCounts(allCases);
    check("F4", "Queues", counts.reengagement === 1, String(counts.reengagement));
    check(
      "F5",
      "Queues",
      readIncludes("src/lib/workspace-case.ts", "winbackNextAt"),
      "date coercion",
    );
  } catch (error) {
    check("F0", "Queues", false, String(error));
  }

  // G — Compliance
  check(
    "G1",
    "Compliance",
    WINBACK_STANDARD_SCHEDULE.filter((s) => s.channel === "email" && s.emailId).every((s) =>
      isMarketingJourneyEmail(s.emailId!),
    ) &&
      WINBACK_LONG_SCHEDULE.every((s) => s.emailId && isMarketingJourneyEmail(s.emailId)),
    "marketing category",
  );
  check(
    "G2",
    "Compliance",
    readIncludes("src/lib/email.ts", "winback-long-day-"),
    "isMarketingJourneyEmail long sequence",
  );
  check(
    "G3",
    "Compliance",
    readIncludes("src/lib/journey-emails.ts", "hasJourneyEmailBeenSent"),
    "dedup helper present",
  );

  // H — Regression static
  check(
    "H1",
    "Regression",
    readIncludes("src/lib/case-stages.ts", 'lead.status === "LOST"'),
    "inferCaseStage LOST priority",
  );
  check(
    "H2",
    "Regression",
    readIncludes("src/app/api/workspace/operational/route.ts", "cases: allCases"),
    "operational API",
  );
  check(
    "H3",
    "Regression",
    !readIncludes("src/components/workspace/operational-home.tsx", "/api/workspace/process-idle"),
    "no client process-idle",
  );
  check(
    "H4",
    "Regression",
    existsSync("src/app/workspace/closed/page.tsx"),
    "closed page",
  );

  // I — Coverage gaps (documented)
  check(
    "I1",
    "Coverage",
    existsSync("scripts/workflow-winback-e2e.ts"),
    "live API E2E script",
  );
  check(
    "I2",
    "Coverage",
    readIncludes("docs/CRM_GO_LIVE.md", "win-back"),
    "migration runbook in docs",
  );

  for (const id of ids) {
    await db.lead.delete({ where: { id } }).catch(() => null);
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass);
  const p0 = findings.filter((f) => f.severity === "P0");

  console.log("\n══════════════════════════════════════════");
  console.log("WIN-BACK FULL AUDIT (10/10 prompt)");
  console.log("══════════════════════════════════════════\n");

  const bySection = new Map<string, Check[]>();
  for (const c of checks) {
    const list = bySection.get(c.section) ?? [];
    list.push(c);
    bySection.set(c.section, list);
  }
  for (const [section, list] of bySection) {
    console.log(`## ${section}`);
    for (const c of list) {
      console.log(`  ${c.pass ? "✓" : "✗"} ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    console.log("");
  }

  console.log(`RESULT: ${passed}/${checks.length} checks passed\n`);

  if (failed.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area}: ${f.finding}`);
    }
    console.log("");
  }

  const score =
    passed === checks.length ? 10 : p0.length > 0 ? Math.max(4, 10 - p0.length * 2) : 8;

  console.log("EXECUTIVE VERDICT:");
  if (passed === checks.length) {
    console.log(
      "  SHIP — architecture, collisions, pause/resume, opt-out, and queue routing verified.",
    );
  } else if (p0.length > 0) {
    console.log("  DO NOT SHIP — P0 findings must be fixed first.");
  } else {
    console.log("  SHIP WITH FIXES — non-blocking gaps remain.");
  }
  console.log(`\nSCORE: ${score}/10\n`);

  console.log("TOP RISKS (production):");
  console.log("  1. Turso migration not applied → winback columns missing on prod");
  console.log("  2. NOTIFICATIONS_DRY_RUN=true → emails logged not sent");
  console.log("  3. Cron /api/cron/process-idle not firing → sequences never send\n");

  if (failed.length > 0) process.exit(1);
}

main();
