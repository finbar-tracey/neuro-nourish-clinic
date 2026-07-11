#!/usr/bin/env npx tsx
/**
 * Pipeline completion workflow — stage persistence + completions queue visibility.
 * Run: npm run workflow:audit
 */
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import type { CaseStage } from "@/generated/prisma/client";
import { leadToCase } from "@/lib/case";
import { transitionCaseStage } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { inferOperationalQueue, normalizeOperationalLead } from "@/lib/operational-queue";
import { caseInQueuePage } from "@/lib/workspace-case";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function advancePipeline(leadId: string, stage: CaseStage) {
  const current = await db.lead.findUnique({ where: { id: leadId } });
  if (!current) throw new Error("Lead missing");

  const queue =
    stage === "COMPLETED" || stage === "COMPLETION_SCHEDULED" || stage === "OFFER_RECEIVED"
      ? "COMPLETION"
      : "APPLICATION";
  const status = stage === "COMPLETED" ? "WON" : current.status;

  return transitionCaseStage(current, stage, `Audit advance to ${stage}`, {
    operationalQueue: queue,
    status,
    ...(stage === "COMPLETED"
      ? {
          probability: 100,
          expectedValue: current.estimatedCommission ?? 0,
          remindersPaused: true,
        }
      : {}),
  });
}

async function main() {
  let leadId: string | undefined;

  try {
    const lead = await db.lead.create({
      data: {
        firstName: "Workflow",
        lastName: "Audit",
        email: "workflow-audit@test.local",
        phone: "07000000099",
        loanPurpose: "purchase",
        loanAmount: 400_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 600_000,
        propertyLocation: "London",
        timeframe: "30_days",
        formCompleted: true,
        caseStage: "DOCUMENTS_RECEIVED",
        operationalQueue: "APPLICATION",
        status: "CONTACTED",
      },
    });
    leadId = lead.id;

    for (const stage of [
      "APPLICATION_SUBMITTED",
      "OFFER_RECEIVED",
      "COMPLETION_SCHEDULED",
      "COMPLETED",
    ] as const) {
      await advancePipeline(leadId, stage);
      const mid = await db.lead.findUnique({ where: { id: leadId } });
      assert(`Stage persists after ${stage}`, mid?.caseStage === stage, mid?.caseStage);
    }

    const done = await db.lead.findUnique({ where: { id: leadId } });
    assert("Final caseStage is COMPLETED", done?.caseStage === "COMPLETED");
    assert("Final status is WON", done?.status === "WON");
    assert("Reminders paused on completion", done?.remindersPaused === true);
    assert(
      "Completed queue inference",
      inferOperationalQueue(done!) === "COMPLETION",
      inferOperationalQueue(done!),
    );

    const normalized = normalizeOperationalLead(done!);
    assert("Normalized next action is None", normalized.nextAction === "None");
    assert("Normalized queue is COMPLETION", normalized.operationalQueue === "COMPLETION");

    const caseView = leadToCase(done!);
    assert("Case view stage is COMPLETED", caseView.stage === "COMPLETED");
    assert("Visible in completions queue page", caseInQueuePage(caseView, "completions"));

    const workspaceCases = [caseView].filter(
      (c) => c.stage !== "LOST" && c.stage !== "DISQUALIFIED",
    );
    assert(
      "Operational cases list includes COMPLETED",
      workspaceCases.some((c) => c.stage === "COMPLETED"),
    );

    const activeOnly = workspaceCases.filter((c) => c.stage !== "COMPLETED");
    assert(
      "Active pipeline excludes COMPLETED",
      activeOnly.length === 0,
    );
  } catch (error) {
    assert("Workflow audit did not throw", false, String(error));
  } finally {
    if (leadId) await db.lead.delete({ where: { id: leadId } }).catch(() => null);
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass);

  console.log("\nWorkflow completion audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);

  if (failed.length > 0) process.exit(1);
}

main();
