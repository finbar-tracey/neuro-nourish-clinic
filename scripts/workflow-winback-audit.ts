#!/usr/bin/env npx tsx
/**
 * Win-back re-engagement workflow audit.
 * Run: npm run workflow:winback
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { leadToCase } from "@/lib/case";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS } from "@/lib/case-stages";
import { db } from "@/lib/db";
import { processDueWinbackEmails } from "@/lib/process-winback-tasks";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { canEnrollWinback } from "@/lib/winback-eligibility";
import { enrollWinback } from "@/lib/winback-sequence";
import { reopenCase } from "@/lib/winback-reopen";
import { WINBACK_STANDARD_SCHEDULE } from "@/lib/winback-schedule";

const SCHEDULED_STANDARD_STEPS = WINBACK_STANDARD_SCHEDULE.filter((s) => s.day > 0).length;
import {
  caseInQueuePage,
  caseInReengagementQueue,
  isWinbackActive,
} from "@/lib/workspace-case";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function main() {
  const ids: string[] = [];

  try {
    assert("Eligible lost reasons defined", canEnrollWinback("No response"));
    assert("Ineligible lost reason blocked", !canEnrollWinback("Went with another broker"));

    const lead = await db.lead.create({
      data: {
        firstName: "Winback",
        lastName: "Audit",
        email: "winback-audit@test.local",
        phone: "07000000201",
        loanPurpose: "purchase",
        loanAmount: 320_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 500_000,
        propertyLocation: "London",
        timeframe: "30_days",
        formCompleted: true,
        caseStage: "CONTACTED",
        operationalQueue: "NEW_LEAD",
        status: "CONTACTED",
        conversationStarted: true,
        nurtureEnrolled: true,
      },
    });
    ids.push(lead.id);

    await enrollLongTimeframeNurture(lead);

    await transitionCaseStage(lead, "LOST", "Audit — no response", {
      status: "LOST",
      lostReason: LOST_REASONS[0],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
    });

    const lostRow = await db.lead.findUnique({ where: { id: lead.id } });
    await enrollWinback(lostRow!);

    const enrolled = await db.lead.findUnique({ where: { id: lead.id } });
    assert("winbackEnrolled true", enrolled?.winbackEnrolled === true);
    assert("winbackStatus active", enrolled?.winbackStatus === "active");
    assert("winbackSequenceId set", enrolled?.winbackSequenceId === "lost-standard");
    assert("nurtureEnrolled cleared", enrolled?.nurtureEnrolled === false);

    const nurtureTasks = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Send nurture email:" },
      },
    });
    assert("Pending nurture tasks cancelled", nurtureTasks === 0);

    const winbackEmailTasks = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
    });
    const winbackSmsTasks = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Win-back SMS:" },
      },
    });
    const winbackTasks = winbackEmailTasks + winbackSmsTasks;
    assert(
      "Win-back tasks scheduled",
      winbackTasks === SCHEDULED_STANDARD_STEPS,
      String(winbackTasks),
    );

    const view = leadToCase(enrolled!);
    assert("Still in closed queue", caseInQueuePage(view, "closed"));
    assert("In re-engagement queue", caseInReengagementQueue(view));
    assert("isWinbackActive", isWinbackActive(view));

    const futureTask = await db.task.findFirst({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
      orderBy: { dueDate: "asc" },
    });
    if (futureTask) {
      await db.task.update({
        where: { id: futureTask.id },
        data: { dueDate: new Date(Date.now() - 60_000) },
      });
    }

    const processed = await processDueWinbackEmails();
    assert("Processor runs", processed.processed >= 0);

    await reopenCase((await db.lead.findUnique({ where: { id: lead.id } }))!);

    const reopened = await db.lead.findUnique({ where: { id: lead.id } });
    assert("Re-open clears LOST status", reopened?.status === "CONTACTED", reopened?.status);
    assert("Re-open stops win-back", reopened?.winbackStatus === "stopped");
    assert("remindersPaused cleared", reopened?.remindersPaused === false);

    const pendingEmail = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
    });
    const pendingSms = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Win-back SMS:" },
      },
    });
    assert("Win-back tasks cancelled on re-open", pendingEmail + pendingSms === 0);

    assert(
      "Cron wired",
      readIncludes("src/app/api/cron/process-idle/route.ts", "processDueWinbackEmails"),
    );
    assert(
      "Re-engagement page",
      readIncludes("src/app/workspace/re-engagement/page.tsx", "ReengagementBoard"),
    );
    assert(
      "Mark lost supports startWinback",
      readIncludes("src/app/api/leads/[id]/route.ts", "startWinback"),
    );
    assert(
      "Case detail win-back checkbox",
      readIncludes("src/components/workspace/case-detail.tsx", "startWinback"),
    );
  } catch (error) {
    assert("Win-back workflow audit did not throw", false, String(error));
  } finally {
    for (const id of ids) {
      await db.lead.delete({ where: { id } }).catch(() => null);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\nWorkflow win-back audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  if (checks.some((c) => !c.pass)) process.exit(1);
}

function readIncludes(path: string, needle: string): boolean {
  return readFileSync(join(process.cwd(), path), "utf8").includes(needle);
}

main();
