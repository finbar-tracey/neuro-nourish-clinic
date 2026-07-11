#!/usr/bin/env npx tsx
/**
 * Live API E2E: form lead → mark lost → appears in closed queue.
 * Run: tsx scripts/workflow-closed-e2e.ts
 */
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { leadToCase } from "@/lib/case";
import { caseInQueuePage } from "@/lib/workspace-case";
import { db } from "@/lib/db";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.WORKSPACE_SECRET ?? "";
const TEST_EMAIL = `closed-e2e-${Date.now()}@test.local`;

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
  let leadId: string | undefined;

  try {
    assert("WORKSPACE_SECRET set", Boolean(SECRET));

    const captureRes = await fetch(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "capture",
        firstName: "Closed",
        lastName: "E2ETest",
        email: TEST_EMAIL,
        phone: "07111222333",
        loanPurpose: "purchase",
        loanAmount: 275000,
        timeframe: "30_days",
        consent: true,
        source: "closed_e2e_test",
      }),
    });
    const captureJson = (await captureRes.json()) as { id?: string; errors?: unknown };
    assert("Step 1 — form capture (201)", captureRes.status === 201, String(captureRes.status));
    leadId = captureJson.id;
    assert("Capture returns lead id", Boolean(leadId), leadId);

    const completeRes = await fetch(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "complete",
        leadId,
        firstName: "Closed",
        lastName: "E2ETest",
        email: TEST_EMAIL,
        phone: "07111222333",
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
        source: "closed_e2e_test",
      }),
    });
    const completeJson = (await completeRes.json()) as { id?: string };
    assert("Step 2 — form complete (201)", completeRes.status === 201, String(completeRes.status));
    assert("Complete keeps same lead id", completeJson.id === leadId, completeJson.id);

    const beforeOp = await api("/api/workspace/operational");
    const beforeJson = (await beforeOp.json()) as { cases?: Array<{ caseId: string; stage: string }> };
    const beforeCase = beforeJson.cases?.find((c) => c.caseId === leadId);
    assert(
      "Step 3 — lead in operational API (active)",
      beforeCase != null && !["LOST", "DISQUALIFIED"].includes(beforeCase.stage),
      beforeCase?.stage,
    );

    const lostRes = await api(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ markLost: true, lostReason: "No response" }),
    });
    const lostJson = (await lostRes.json()) as { status?: string; caseStage?: string; lostReason?: string };
    assert("Step 4 — mark lost (200)", lostRes.status === 200, String(lostRes.status));
    assert("Status is LOST", lostJson.status === "LOST", lostJson.status);
    assert("caseStage is LOST", lostJson.caseStage === "LOST", lostJson.caseStage);
    assert("lostReason stored", lostJson.lostReason === "No response", lostJson.lostReason);

    const afterOp = await api("/api/workspace/operational");
    const afterJson = (await afterOp.json()) as { cases?: Array<{ caseId: string; stage: string }> };
    const afterCase = afterJson.cases?.find((c) => c.caseId === leadId);
    assert("Step 5 — still in operational cases list", afterCase != null, afterCase?.stage);
    assert("Step 5 — stage LOST in API", afterCase?.stage === "LOST", afterCase?.stage);

    const dbLead = await db.lead.findUnique({ where: { id: leadId! } });
    assert("Step 6 — lead exists in DB", dbLead != null);
    if (dbLead) {
      const view = leadToCase(dbLead);
      assert("Step 6 — caseInQueuePage(closed)", caseInQueuePage(view, "closed"));
      assert("Step 6 — not in completions", !caseInQueuePage(view, "completions"));
      assert("Step 6 — reminders paused", dbLead.remindersPaused === true);
    }

    const navRes = await api("/api/workspace/nav-counts");
    const navJson = (await navRes.json()) as { counts?: { closed?: number } };
    assert(
      "Nav counts include closed bucket",
      typeof navJson.counts?.closed === "number",
      String(navJson.counts?.closed),
    );
  } catch (error) {
    assert("E2E did not throw", false, String(error));
  } finally {
    if (leadId) {
      await db.lead.delete({ where: { id: leadId } }).catch(() => null);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\nClosed workflow E2E (live API)\n");
  console.log(`Lead email: ${TEST_EMAIL}\n`);
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  if (checks.some((c) => !c.pass)) process.exit(1);
}

main();
