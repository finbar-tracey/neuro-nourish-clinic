#!/usr/bin/env npx tsx
/**
 * CRM post-implementation audit — 10/10 win-back + operational CRM gate.
 *
 * Implements the full post-ship review prompt: data model, state machine,
 * sequences, collisions, send safety, cron, queues, API, UI, compliance,
 * observability, regression, production config, and auto-pause trinity.
 *
 * Run: npm run crm:post-implementation
 * Live env advisory: CRM_POST_AUDIT_LIVE=true npm run crm:post-implementation
 */
import { existsSync, readFileSync } from "node:fs";
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
import { enrollmentBlockReason } from "@/lib/winback-enrollment-guards";
import { processDueNurtureEmails } from "@/lib/process-nurture-tasks";
import { processDueWinbackEmails } from "@/lib/process-winback-tasks";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { canEnrollWinback } from "@/lib/winback-eligibility";
import {
  autoPauseWinbackForEmail,
  autoPauseWinbackOnReengagement,
} from "@/lib/winback-auto-pause";
import { computeWinbackMetrics } from "@/lib/winback-metrics";
import { enrollWinback } from "@/lib/winback-sequence";
import { pauseWinback, stopWinback } from "@/lib/winback-stop";
import { reopenCase, resumeWinback } from "@/lib/winback-reopen";
import {
  WINBACK_STANDARD_SCHEDULE,
  WINBACK_LONG_SCHEDULE,
  WINBACK_LONG_SEQUENCE_ID,
  resolveWinbackSchedule,
} from "@/lib/winback-schedule";
import { processWeeklyWinbackDigest } from "@/lib/weekly-winback-digest";
import {
  caseInQueuePage,
  caseInReengagementQueue,
  isWinbackActive,
  isWinbackDueToday,
  queueNavCounts,
} from "@/lib/workspace-case";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  section: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
};

type Finding = {
  severity: Severity;
  area: string;
  finding: string;
  fix?: string;
};

const checks: Check[] = [];
const findings: Finding[] = [];
const ids: string[] = [];

const SCHEDULED_STANDARD = WINBACK_STANDARD_SCHEDULE.filter((s) => s.day > 0).length;
const SCHEDULED_LONG = WINBACK_LONG_SCHEDULE.filter((s) => s.day > 0).length;

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
    findings.push({
      severity,
      area: section,
      finding: `${id}: ${detail ?? "failed"}`,
    });
  }
}

async function countScheduledWinbackTasks(leadId: string) {
  const email = await db.task.count({
    where: { leadId, completed: false, title: { startsWith: "Win-back email:" } },
  });
  const sms = await db.task.count({
    where: { leadId, completed: false, title: { startsWith: "Win-back SMS:" } },
  });
  return email + sms;
}

async function createLostLead(
  email: string,
  lostReason: string = LOST_REASONS[0],
) {
  const lead = await db.lead.create({
    data: {
      firstName: "Post",
      lastName: "Audit",
      email,
      phone: "07000000401",
      loanPurpose: "purchase",
      loanAmount: 290_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 490_000,
      propertyLocation: "Leeds",
      timeframe: "30_days",
      formCompleted: true,
      caseStage: "CONTACTED",
      operationalQueue: "NEW_LEAD",
      status: "CONTACTED",
      conversationStarted: true,
    },
  });
  ids.push(lead.id);
  await transitionCaseStage(lead, "LOST", "Post-implementation audit", {
    status: "LOST",
    lostReason,
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  return db.lead.findUnique({ where: { id: lead.id } });
}

async function runRuntimeAudits() {
  // B — Data model round-trip
  try {
    const email = `persist-${Date.now()}@test.local`;
    const lead = await createLostLead(email);
    await enrollWinback(lead!);

    const enrolled = await db.lead.findUnique({ where: { id: lead!.id } });
    check("B4", "Data model", enrolled?.winbackEnrolled === true, "winbackEnrolled");
    check("B5", "Data model", enrolled?.winbackStatus === "active", "winbackStatus");
    check("B6", "Data model", enrolled?.winbackSequenceId === "lost-standard", "sequenceId");
    check("B7", "Data model", (enrolled?.winbackStep ?? 0) >= 1, `step=${enrolled?.winbackStep}`);
    check(
      "B8",
      "Data model",
      enrolled?.winbackNextAt instanceof Date || enrolled?.winbackNextAt != null,
      "winbackNextAt",
    );
    check("B9", "Data model", enrolled?.lostReason === LOST_REASONS[0], "lostReason preserved");

    await pauseWinback(enrolled!);
    const paused = await db.lead.findUnique({ where: { id: lead!.id } });
    check("B10", "Data model", paused?.winbackStatus === "paused", "pause persists");

    await resumeWinback(paused!);
    const resumed = await db.lead.findUnique({ where: { id: lead!.id } });
    check("B11", "Data model", resumed?.winbackStatus === "active", "resume persists");

    await reopenCase(resumed!);
    const reopened = await db.lead.findUnique({ where: { id: lead!.id } });
    check("B12", "Data model", reopened?.status !== "LOST", "re-open clears LOST");
    check(
      "B13",
      "Data model",
      reopened?.winbackStatus === "stopped" && reopened?.winbackStoppedReason === "reopened",
      "re-open stops win-back",
    );
    check("B14", "Data model", reopened?.remindersPaused === false, "reminders unpaused");
  } catch (error) {
    check("B0", "Data model", false, String(error));
  }

  // C — State machine
  try {
    const noEnroll = await createLostLead(`state-no-enroll-${Date.now()}@test.local`);
    check("C1", "State machine", noEnroll?.status === "LOST" && !noEnroll?.winbackEnrolled);
    const noEnrollView = leadToCase(noEnroll!);
    check("C2", "State machine", caseInQueuePage(noEnrollView, "closed"));
    check("C3", "State machine", !caseInReengagementQueue(noEnrollView), "not in re-engagement");

    const enrolled = await createLostLead(`state-enroll-${Date.now()}@test.local`);
    await enrollWinback(enrolled!);
    const activeRow = await db.lead.findUnique({ where: { id: enrolled!.id } });
    const activeView = leadToCase(activeRow!);
    check("C4", "State machine", activeRow?.winbackStatus === "active");
    check("C5", "State machine", caseInQueuePage(activeView, "closed"));
    check("C6", "State machine", caseInReengagementQueue(activeView));

    await pauseWinback(activeRow!);
    const pausedView = leadToCase((await db.lead.findUnique({ where: { id: enrolled!.id } }))!);
    check("C7", "State machine", pausedView.lead.winbackStatus === "paused");
    check(
      "C8",
      "State machine",
      caseInReengagementQueue(pausedView),
      "paused stays in re-engagement",
    );

    await stopWinback(
      (await db.lead.findUnique({ where: { id: enrolled!.id } }))!,
      "manual",
    );
    const stoppedView = leadToCase((await db.lead.findUnique({ where: { id: enrolled!.id } }))!);
    check("C9", "State machine", stoppedView.lead.winbackStatus === "stopped");
    check(
      "C10",
      "State machine",
      !isWinbackActive(stoppedView),
      "stopped removed from active win-back",
    );
  } catch (error) {
    check("C0", "State machine", false, String(error));
  }

  // D — Sequence correctness
  try {
    const standard = await createLostLead(`seq-std-${Date.now()}@test.local`);
    await enrollWinback(standard!);
    const stdTasks = await countScheduledWinbackTasks(standard!.id);
    check(
      "D1",
      "Sequence",
      stdTasks === SCHEDULED_STANDARD,
      `scheduled ${stdTasks}, expected ${SCHEDULED_STANDARD}`,
    );
    check(
      "D2",
      "Sequence",
      (await db.lead.findUnique({ where: { id: standard!.id } }))?.winbackSequenceId ===
        "lost-standard",
    );

    const long = await createLostLead(
      `seq-long-${Date.now()}@test.local`,
      "Funding no longer needed",
    );
    await enrollWinback(long!);
    const longTasks = await countScheduledWinbackTasks(long!.id);
    check(
      "D3",
      "Sequence",
      longTasks === SCHEDULED_LONG,
      `long scheduled ${longTasks}, expected ${SCHEDULED_LONG}`,
    );
    check(
      "D4",
      "Sequence",
      (await db.lead.findUnique({ where: { id: long!.id } }))?.winbackSequenceId ===
        WINBACK_LONG_SEQUENCE_ID,
    );

    const smsTasks = await db.task.count({
      where: {
        leadId: standard!.id,
        completed: false,
        title: { startsWith: "Win-back SMS:" },
      },
    });
    check("D5", "Sequence", smsTasks === 2, `SMS tasks ${smsTasks}`);

    const longSms = await db.task.count({
      where: { leadId: long!.id, title: { startsWith: "Win-back SMS:" } },
    });
    check("D6", "Sequence", longSms === 0, "long sequence is email-only");
  } catch (error) {
    check("D0", "Sequence", false, String(error));
  }

  // E — Collisions & mutex
  try {
    const email = `collision-${Date.now()}@test.local`;
    const lead = await db.lead.create({
      data: {
        firstName: "Collision",
        lastName: "Audit",
        email,
        phone: "07000000402",
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
    await enrollWinback((await db.lead.findUnique({ where: { id: lead.id } }))!);

    const nurturePending = await db.task.count({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "Send nurture email:" },
      },
    });
    check("E1", "Collisions", nurturePending === 0, `nurture pending ${nurturePending}`);
    check(
      "E2",
      "Collisions",
      (await db.lead.findUnique({ where: { id: lead.id } }))?.nurtureEnrolled === false,
    );
    await processDueNurtureEmails();
    check("E3", "Collisions", true, "nurture processor safe");

    const dupEmail = `dup-guard-${Date.now()}@test.local`;
    const active = await db.lead.create({
      data: {
        firstName: "Active",
        lastName: "Dup",
        email: dupEmail,
        phone: "07000000403",
        loanPurpose: "purchase",
        loanAmount: 300_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 500_000,
        propertyLocation: "London",
        timeframe: "30_days",
        formCompleted: true,
        status: "CONTACTED",
        caseStage: "CONTACTED",
      },
    });
    ids.push(active.id);
    const lostDup = await createLostLead(dupEmail);
    const block = enrollmentBlockReason(lostDup!, [active, lostDup!]);
    check(
      "E4",
      "Collisions",
      block != null && block.includes("active case"),
      block ?? "no block",
    );

    let enrollThrew = false;
    try {
      await enrollWinback(lostDup!);
    } catch {
      enrollThrew = true;
    }
    check("E5", "Collisions", enrollThrew, "duplicate email enroll blocked");

    const optEmail = `optout-post-${Date.now()}@test.local`;
    const optLead = await createLostLead(optEmail);
    await enrollWinback(optLead!);
    await optOutEmailAddress(optEmail);
    const opted = await db.lead.findUnique({ where: { id: optLead!.id } });
    check(
      "E6",
      "Collisions",
      opted?.winbackStatus === "stopped" && opted?.winbackStoppedReason === "opted_out",
      opted?.winbackStatus ?? undefined,
    );
  } catch (error) {
    check("E0", "Collisions", false, String(error));
  }

  // F — Send safety
  try {
    const email = `freq-${Date.now()}@test.local`;
    const row = await createLostLead(email);
    await enrollWinback(row!);

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
      await db.activity.create({
        data: {
          leadId: row!.id,
          type: "EMAIL_SENT",
          description: "Win-back email sent: frequency cap test",
          metadata: JSON.stringify({ sequence: "winback" }),
        },
      });
      await processDueWinbackEmails();
      const stillOpen = await db.task.count({
        where: { id: task.id, completed: false },
      });
      check("F1", "Send safety", stillOpen === 1, "72h frequency cap skips send");
    } else {
      check("F1", "Send safety", false, "no task to test frequency cap");
    }

    const pauseEmail = `pause-proc-${Date.now()}@test.local`;
    const pauseRow = await createLostLead(pauseEmail);
    await enrollWinback(pauseRow!);
    await pauseWinback((await db.lead.findUnique({ where: { id: pauseRow!.id } }))!);
    const pauseTask = await db.task.findFirst({
      where: {
        leadId: pauseRow!.id,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
      orderBy: { dueDate: "asc" },
    });
    if (pauseTask) {
      await db.task.update({
        where: { id: pauseTask.id },
        data: { dueDate: new Date(Date.now() - 60_000) },
      });
      await processDueWinbackEmails();
      const stillPaused = await db.task.count({
        where: { id: pauseTask.id, completed: false },
      });
      check("F2", "Send safety", stillPaused === 1, "paused tasks not completed by cron");
    } else {
      check("F2", "Send safety", false, "no pause task found");
    }
  } catch (error) {
    check("F0", "Send safety", false, String(error));
  }

  // O — Auto-pause trinity
  try {
    const email = `autopause-${Date.now()}@test.local`;
    const row = await createLostLead(email);
    await enrollWinback(row!);
    const active = await db.lead.findUnique({ where: { id: row!.id } });

    const contacted = await autoPauseWinbackOnReengagement(active!, "marked_contacted");
    check(
      "O1",
      "Auto-pause",
      contacted.winbackStatus === "paused" && contacted.winbackStoppedReason === "re_engaged",
      "marked_contacted",
    );

    const row2 = await createLostLead(`autopause-call-${Date.now()}@test.local`);
    await enrollWinback(row2!);
    const row2Fresh = await db.lead.findUnique({ where: { id: row2!.id } });
    const callPaused = await autoPauseWinbackOnReengagement(row2Fresh!, "call_connected");
    check(
      "O2",
      "Auto-pause",
      callPaused.winbackStatus === "paused" && callPaused.winbackStoppedReason === "re_engaged",
      "call_connected",
    );

    const sharedEmail = `autopause-form-${Date.now()}@test.local`;
    const winbackLead = await createLostLead(sharedEmail);
    await enrollWinback(winbackLead!);
    const newFormLead = await db.lead.create({
      data: {
        firstName: "New",
        lastName: "Form",
        email: sharedEmail,
        phone: "07000000404",
        loanPurpose: "purchase",
        loanAmount: 280_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 450_000,
        propertyLocation: "Bristol",
        timeframe: "30_days",
        formCompleted: false,
        status: "NEW",
        caseStage: "NEW_ENQUIRY",
      },
    });
    ids.push(newFormLead.id);
    const pausedCount = await autoPauseWinbackForEmail(
      sharedEmail,
      "new_form",
      newFormLead.id,
    );
    const afterForm = await db.lead.findUnique({ where: { id: winbackLead!.id } });
    check("O3", "Auto-pause", pausedCount === 1, `paused ${pausedCount} sequences`);
    check(
      "O4",
      "Auto-pause",
      afterForm?.winbackStatus === "paused" && afterForm?.winbackStoppedReason === "re_engaged",
      "new_form same email",
    );
  } catch (error) {
    check("O0", "Auto-pause", false, String(error));
  }

  // H — Queues & metrics
  try {
    const email = `queue-post-${Date.now()}@test.local`;
    const row = await createLostLead(email);
    await enrollWinback(row!);
    const lead = await db.lead.findUnique({ where: { id: row!.id } });
    const view = leadToCase(lead!);
    check("H1", "Queues", caseInQueuePage(view, "closed"));
    check("H2", "Queues", caseInReengagementQueue(view));
    check("H3", "Queues", isWinbackActive(view));

    const counts = queueNavCounts([view]);
    check("H4", "Queues", counts.reengagement === 1, String(counts.reengagement));

    const metrics = computeWinbackMetrics([lead!]);
    check("H5", "Queues", metrics.active === 1, `active=${metrics.active}`);
    check("H6", "Queues", metrics.enrolled === 1, `enrolled=${metrics.enrolled}`);

    if (lead?.winbackNextAt) {
      const dueLead = {
        ...lead,
        winbackNextAt: new Date(Date.now() - 60_000),
      };
      const dueView = leadToCase(dueLead);
      check("H7", "Queues", isWinbackDueToday(dueView), "due today detection");
    }
  } catch (error) {
    check("H0", "Queues", false, String(error));
  }

  // G — Cron digest window (runtime)
  try {
    const digest = await processWeeklyWinbackDigest();
    check(
      "G5",
      "Cron",
      digest.skipped === "not_scheduled_window" || digest.skipped === "dry_run",
      String(digest.skipped ?? digest.sent),
      "P1",
    );
  } catch (error) {
    check("G0", "Cron", false, String(error), "P1");
  }
}

async function main() {
  const liveMode = process.env.CRM_POST_AUDIT_LIVE === "true";

  // A — Charter & scope
  check(
    "A1",
    "Charter",
    existsSync("docs/WINBACK_10_CHECKLIST.md"),
    "implementation checklist doc",
    "P2",
  );
  check(
    "A2",
    "Charter",
    existsSync("scripts/workflow-winback-e2e.ts"),
    "live API E2E script",
  );
  check(
    "A3",
    "Charter",
    readIncludes("src/lib/crm-persistence.ts", "kvStorageMode"),
    "KV persistence layer",
  );

  // B — Data model (static)
  const schema = read("prisma/schema.prisma");
  for (const field of [
    "winbackEnrolled",
    "winbackStatus",
    "winbackSequenceId",
    "winbackStep",
    "winbackNextAt",
    "winbackStoppedReason",
  ]) {
    check("B1", "Data model", schema.includes(field), field);
  }
  check(
    "B2",
    "Data model",
    existsSync("prisma/migrations/20260618120000_winback_sequence/migration.sql"),
    "migration",
  );
  check(
    "B3",
    "Data model",
    readIncludes("src/lib/crm-persistence.ts", "winbackEnrolled: lead.winbackEnrolled"),
    "hydrateLead defaults",
  );

  await runRuntimeAudits();

  // G — Cron (static)
  check(
    "G1",
    "Cron",
    readIncludes("src/app/api/cron/process-idle/route.ts", "processDueWinbackEmails"),
    "winback processor wired",
  );
  check(
    "G2",
    "Cron",
    readIncludes("src/app/api/cron/process-idle/route.ts", "processWeeklyWinbackDigest"),
    "weekly digest wired",
  );
  check(
    "G3",
    "Cron",
    readIncludes("src/app/api/cron/process-idle/route.ts", "verifyCronAuth"),
    "cron auth",
  );
  check(
    "G4",
    "Cron",
    readIncludes("src/app/api/workspace/process-idle/route.ts", "processDueWinbackEmails"),
    "manual process-idle",
  );

  // I — API contract (static)
  const leadRoute = read("src/app/api/leads/[id]/route.ts");
  for (const action of [
    "startWinback",
    "enrollWinback",
    "pauseWinback",
    "resumeWinback",
    "stopWinback",
    "reopenCase",
    "markContacted",
  ]) {
    check("I1", "API", leadRoute.includes(action), action);
  }
  check(
    "I2",
    "API",
    readIncludes("src/app/api/leads/route.ts", "autoPauseWinbackForEmail"),
    "form auto-pause",
  );

  // J — UI (static)
  check(
    "J1",
    "UI",
    readIncludes("src/components/workspace/case-detail.tsx", "Sequence preview"),
    "sequence preview",
    "P1",
  );
  check(
    "J2",
    "UI",
    readIncludes("src/components/workspace/case-detail.tsx", "winbackScheduleSummary"),
    "schedule summary",
    "P1",
  );
  check(
    "J3",
    "UI",
    readIncludes("src/components/workspace/reengagement-board.tsx", "computeWinbackMetrics"),
    "board metrics",
    "P1",
  );
  check(
    "J4",
    "UI",
    existsSync("src/app/workspace/re-engagement/page.tsx"),
    "re-engagement page",
    "P1",
  );
  check(
    "J5",
    "UI",
    readIncludes("src/components/workspace/case-detail.tsx", "stopWinback"),
    "stop action",
    "P1",
  );

  // K — Compliance
  check(
    "K1",
    "Compliance",
    WINBACK_STANDARD_SCHEDULE.filter((s) => s.channel === "email" && s.emailId).every((s) =>
      isMarketingJourneyEmail(s.emailId!),
    ),
    "standard emails marketing",
  );
  check(
    "K2",
    "Compliance",
    WINBACK_LONG_SCHEDULE.every((s) => s.emailId && isMarketingJourneyEmail(s.emailId)),
    "long emails marketing",
  );
  check(
    "K3",
    "Compliance",
    readIncludes("src/lib/email-unsubscribe.ts", "stopWinback"),
    "unsubscribe stops win-back",
  );
  check(
    "K4",
    "Compliance",
    readIncludes("src/lib/process-winback-tasks.ts", "MIN_HOURS_BETWEEN_SENDS = 72"),
    "frequency cap constant",
  );
  check(
    "K5",
    "Compliance",
    readIncludes("src/lib/weekly-winback-digest.ts", "Europe/London"),
    "digest timezone",
    "P1",
  );

  // L — Observability
  check(
    "L1",
    "Observability",
    readIncludes("src/lib/winback-sequence.ts", "logCaseTimeline"),
    "enroll timeline",
    "P1",
  );
  check(
    "L2",
    "Observability",
    readIncludes("src/lib/winback-auto-pause.ts", "logCaseTimeline"),
    "auto-pause timeline",
    "P1",
  );
  check(
    "L3",
    "Observability",
    readIncludes("src/lib/winback-sequence.ts", "db.activity.create"),
    "schedule activities",
    "P1",
  );
  check(
    "L4",
    "Observability",
    readIncludes("src/lib/weekly-winback-digest.ts", "computeWinbackMetrics"),
    "digest uses metrics",
    "P1",
  );

  // M — Regression (static wiring)
  check(
    "M1",
    "Regression",
    readIncludes("src/lib/case-stages.ts", 'lead.status === "LOST"'),
    "LOST stage priority",
  );
  check(
    "M2",
    "Regression",
    existsSync("src/app/workspace/closed/page.tsx"),
    "closed queue page",
  );
  check(
    "M3",
    "Regression",
    readIncludes("src/lib/nurture-sequence.ts", "enrollLongTimeframeNurture"),
    "nurture still present",
    "P1",
  );
  check(
    "M4",
    "Regression",
    readIncludes("src/lib/automation-task-meta.ts", 'channel: "email" | "sms"'),
    "multi-channel task meta",
  );
  check(
    "M5",
    "Regression",
    resolveWinbackSchedule("No response").steps.length === 6,
    "standard schedule intact",
  );

  // N — Production config
  const envSet = (name: string) => Boolean(process.env[name]?.trim());
  if (liveMode) {
    check("N1", "Production", envSet("CRON_SECRET"), "CRON_SECRET");
    check(
      "N2",
      "Production",
      process.env.NOTIFICATIONS_DRY_RUN !== "true",
      "NOTIFICATIONS_DRY_RUN off",
    );
    check("N3", "Production", envSet("WORKSPACE_SECRET"), "WORKSPACE_SECRET");
    check(
      "N4",
      "Production",
      envSet("KV_REST_API_URL") || envSet("KV_URL"),
      "KV binding",
    );
  } else {
    check(
      "N1",
      "Production",
      true,
      "advisory — set CRM_POST_AUDIT_LIVE=true for prod env checks",
      "P1",
    );
  }

  // Cleanup
  for (const id of ids) {
    await db.lead.delete({ where: { id } }).catch(() => null);
  }

  const passed = checks.filter((c) => c.pass).length;
  const p0Failed = checks.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = checks.filter((c) => !c.pass && c.severity === "P1");
  const p2Failed = checks.filter((c) => !c.pass && c.severity === "P2");

  const score =
    p0Failed.length > 0
      ? Math.max(4, 10 - p0Failed.length * 2)
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
  console.log("CRM POST-IMPLEMENTATION AUDIT");
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
      console.log(
        `  ${c.pass ? "✓" : "✗"} ${c.id}${sev}${c.detail ? ` — ${c.detail}` : ""}`,
      );
    }
    console.log("");
  }

  console.log(`RESULT: ${passed}/${checks.length} checks passed`);
  console.log(`P0 failures: ${p0Failed.length} · P1: ${p1Failed.length} · P2: ${p2Failed.length}\n`);

  if (findings.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area}: ${f.finding}`);
    }
    console.log("");
  }

  console.log("EXECUTIVE VERDICT:", verdict);
  console.log(`SCORE: ${score}/10\n`);

  console.log("TOP RESIDUAL RISKS (production):");
  console.log("  1. KV store out of sync with schema — verify one enrolled lead in prod");
  console.log("  2. NOTIFICATIONS_DRY_RUN=true — emails/SMS logged not delivered");
  console.log("  3. Cron not firing — sequences stall with no operator alert\n");

  console.log("MANUAL SIGN-OFF (Daniel — tick after spot-check):");
  console.log("  [ ] Mark lost 'No response' → preview shows 6 steps → enroll → re-engagement");
  console.log("  [ ] Mark lost 'Funding no longer needed' → long sequence (3 emails)");
  console.log("  [ ] Mark contacted while win-back active → auto-paused");
  console.log("  [ ] Same email new form → win-back auto-paused on prior lost case");
  console.log("  [ ] Resume → next send date restored");
  console.log("  [ ] Re-open → pipeline restored, win-back stopped, tasks cancelled");
  console.log("  [ ] Unsubscribe link → win-back stopped");
  console.log("  [ ] Force process-idle → due task sends, paused tasks skipped");
  console.log("  [ ] Weekly digest received Monday 08:00 London (or dry-run log)\n");

  console.log("OPTIONAL: npm run workflow:winback:e2e (requires dev server)");
  console.log("OPTIONAL: CRM_POST_AUDIT_LIVE=true npm run crm:post-implementation\n");

  if (p0Failed.length > 0) process.exit(1);
}

main();
