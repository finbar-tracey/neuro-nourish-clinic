#!/usr/bin/env npx tsx
/**
 * Live API E2E: form lead → mark lost + win-back → re-engagement queue.
 * Run: npm run workflow:winback:e2e
 * Requires dev server on E2E_BASE_URL (default localhost:3000).
 */
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { leadToCase } from "@/lib/case";
import {
  caseInQueuePage,
  caseInReengagementQueue,
  isWinbackActive,
} from "@/lib/workspace-case";
import { db } from "@/lib/db";
import { WINBACK_STANDARD_SCHEDULE } from "@/lib/winback-schedule";

const SCHEDULED_STANDARD_STEPS = WINBACK_STANDARD_SCHEDULE.filter((s) => s.day > 0).length;

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.WORKSPACE_SECRET ?? "";
const TEST_EMAIL = `winback-e2e-${Date.now()}@test.local`;

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function api(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function main() {
  const ids: string[] = [];
  let leadId: string | undefined;
  let serverUp = false;

  try {
    const ping = await fetch(`${BASE}/workspace`, { redirect: "manual" }).catch(() => null);
    serverUp = ping != null && ping.status < 500;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    console.log("\nWin-back E2E (live API)\n");
    console.log("✗ FAILED — dev server not reachable at", BASE);
    console.log("  Start with: npm run dev\n");
    process.exit(1);
  }

  try {
    assert("WORKSPACE_SECRET set", Boolean(SECRET));

    const captureRes = await fetch(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "capture",
        firstName: "Winback",
        lastName: "E2E",
        email: TEST_EMAIL,
        phone: "07111444555",
        loanPurpose: "purchase",
        loanAmount: 275000,
        timeframe: "30_days",
        consent: true,
        source: "winback_e2e_test",
      }),
    });
    const captureJson = (await captureRes.json()) as { id?: string };
    assert("Form capture", captureRes.status === 201, String(captureRes.status));
    leadId = captureJson.id;
    if (leadId) ids.push(leadId);

    await fetch(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "complete",
        leadId,
        firstName: "Winback",
        lastName: "E2E",
        email: TEST_EMAIL,
        phone: "07111444555",
        loanPurpose: "purchase",
        loanAmount: 275000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 450000,
        propertyLocation: "Birmingham",
        timeframe: "30_days",
        hasExistingMortgage: false,
        willOccupy: false,
        hasEverOccupied: false,
        consent: true,
        source: "winback_e2e_test",
      }),
    });

    const lostRes = await api(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({
        markLost: true,
        lostReason: "No response",
        startWinback: true,
      }),
    });
    const lostJson = (await lostRes.json()) as {
      status?: string;
      winbackStatus?: string;
      winbackEnrolled?: boolean;
    };
    assert("Mark lost + win-back", lostRes.status === 200, String(lostRes.status));
    assert("Status LOST", lostJson.status === "LOST", lostJson.status);
    assert("winbackStatus active", lostJson.winbackStatus === "active", lostJson.winbackStatus);
    assert("winbackEnrolled", lostJson.winbackEnrolled === true);

    const emailTasks = await db.task.count({
      where: {
        leadId: leadId!,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
    });
    const smsTasks = await db.task.count({
      where: {
        leadId: leadId!,
        completed: false,
        title: { startsWith: "Win-back SMS:" },
      },
    });
    const tasks = emailTasks + smsTasks;
    assert(
      "Scheduled win-back tasks",
      tasks === SCHEDULED_STANDARD_STEPS,
      String(tasks),
    );

    const op = await api("/api/workspace/operational");
    const opJson = (await op.json()) as { cases?: Array<{ caseId: string }> };
    const inOp = opJson.cases?.some((c) => c.caseId === leadId);
    assert("In operational API", inOp === true);

    const nav = await api("/api/workspace/nav-counts");
    const navJson = (await nav.json()) as { counts?: { reengagement?: number } };
    assert(
      "Nav reengagement count",
      typeof navJson.counts?.reengagement === "number" && navJson.counts.reengagement >= 1,
      String(navJson.counts?.reengagement),
    );

    const dbLead = await db.lead.findUnique({ where: { id: leadId! } });
    const view = leadToCase(dbLead!);
    assert("Closed queue", caseInQueuePage(view, "closed"));
    assert("Re-engagement queue", caseInReengagementQueue(view));
    assert("isWinbackActive", isWinbackActive(view));

    const pauseRes = await api(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ pauseWinback: true }),
    });
    const pauseJson = (await pauseRes.json()) as { winbackStatus?: string };
    assert("Pause win-back", pauseRes.status === 200, String(pauseRes.status));
    assert("Status paused", pauseJson.winbackStatus === "paused", pauseJson.winbackStatus);

    const navPaused = await api("/api/workspace/nav-counts");
    const navPausedJson = (await navPaused.json()) as { counts?: { reengagement?: number } };
    const countBeforeResume = navPausedJson.counts?.reengagement ?? 0;

    const resumeRes = await api(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ resumeWinback: true }),
    });
    const resumeJson = (await resumeRes.json()) as {
      winbackStatus?: string;
      winbackNextAt?: string | null;
    };
    assert("Resume win-back", resumeRes.status === 200, String(resumeRes.status));
    assert("Status active again", resumeJson.winbackStatus === "active", resumeJson.winbackStatus);
    assert("nextAt restored", resumeJson.winbackNextAt != null, String(resumeJson.winbackNextAt));

    const idleRes = await api("/api/workspace/process-idle", { method: "POST" });
    const idleJson = (await idleRes.json()) as { ok?: boolean; winback?: unknown };
    assert("process-idle runs", idleRes.status === 200, String(idleRes.status));
    assert("process-idle returns winback", idleJson.ok === true && idleJson.winback != null);

    const reopenRes = await api(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ reopenCase: true }),
    });
    const reopenJson = (await reopenRes.json()) as {
      status?: string;
      winbackStatus?: string;
      remindersPaused?: boolean;
    };
    assert("Re-open case", reopenRes.status === 200, String(reopenRes.status));
    assert("No longer LOST", reopenJson.status !== "LOST", reopenJson.status);
    assert("Win-back stopped", reopenJson.winbackStatus === "stopped", reopenJson.winbackStatus);
    assert("Reminders unpaused", reopenJson.remindersPaused === false);

    const pendingAfterReopen = await db.task.count({
      where: {
        leadId: leadId!,
        completed: false,
        title: { startsWith: "Win-back email:" },
      },
    });
    assert("Tasks cancelled on re-open", pendingAfterReopen === 0, String(pendingAfterReopen));

    void countBeforeResume;

    // Second lead: enroll on already-closed case
    const lead2 = await db.lead.create({
      data: {
        firstName: "Enroll",
        lastName: "Later",
        email: `winback-enroll-${Date.now()}@test.local`,
        phone: "07111555666",
        loanPurpose: "purchase",
        loanAmount: 260_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 420_000,
        propertyLocation: "Leeds",
        timeframe: "30_days",
        formCompleted: true,
        status: "LOST",
        caseStage: "LOST",
        lostReason: "Funding no longer needed",
        remindersPaused: true,
      },
    });
    ids.push(lead2.id);

    const enrollRes = await api(`/api/leads/${lead2.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enrollWinback: true }),
    });
    const enrollJson = (await enrollRes.json()) as { winbackStatus?: string };
    assert("Enroll on closed lost", enrollRes.status === 200, String(enrollRes.status));
    assert("Enrolled active", enrollJson.winbackStatus === "active", enrollJson.winbackStatus);
  } catch (error) {
    assert("E2E did not throw", false, String(error));
  } finally {
    for (const id of ids) {
      await db.lead.delete({ where: { id } }).catch(() => null);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\nWin-back E2E (live API)\n");
  console.log(`Lead: ${TEST_EMAIL}\n`);
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  if (checks.some((c) => !c.pass)) process.exit(1);
}

main();
