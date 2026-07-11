#!/usr/bin/env npx tsx
/**
 * Lost / disqualified → closed queue wiring audit.
 * Run: npm run workflow:closed
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { leadToCase } from "@/lib/case";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS, DISQUALIFIED_REASONS } from "@/lib/case-stages";
import { db } from "@/lib/db";
import { leadInInboxQueue } from "@/lib/operational-queue";
import {
  caseInOperationalQueue,
  caseInQueuePage,
  isClosedCase,
} from "@/lib/workspace-case";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string | null) {
  checks.push({ name, pass, detail: detail ?? undefined });
}

async function main() {
  const ids: string[] = [];

  try {
    const lostLead = await db.lead.create({
      data: {
        firstName: "Closed",
        lastName: "LostAudit",
        email: "closed-lost-audit@test.local",
        phone: "07000000101",
        loanPurpose: "purchase",
        loanAmount: 300_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 500_000,
        propertyLocation: "London",
        timeframe: "30_days",
        formCompleted: true,
        caseStage: "CONTACTED",
        operationalQueue: "NEW_LEAD",
        status: "CONTACTED",
      },
    });
    ids.push(lostLead.id);

    await transitionCaseStage(lostLead, "LOST", "Audit — no response", {
      status: "LOST",
      lostReason: LOST_REASONS[0],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
    });

    const lostRow = await db.lead.findUnique({ where: { id: lostLead.id } });
    assert("markLost sets status LOST", lostRow?.status === "LOST", lostRow?.status);
    assert("markLost sets caseStage LOST", lostRow?.caseStage === "LOST", lostRow?.caseStage);
    assert("markLost stores lostReason", lostRow?.lostReason === LOST_REASONS[0], lostRow?.lostReason);
    assert("markLost pauses reminders", lostRow?.remindersPaused === true);

    const lostView = leadToCase(lostRow!);
    assert("leadToCase stage is LOST", lostView.stage === "LOST");
    assert("Visible in closed queue", caseInQueuePage(lostView, "closed"));
    assert("Not in completions queue", !caseInQueuePage(lostView, "completions"));
    assert("Not in inbox NEW_LEAD queue", !leadInInboxQueue(lostRow!, "NEW_LEAD"));
    assert("Not in active callbacks queue", !caseInOperationalQueue(lostView, "AWAITING_CALLBACK"));
    assert("isClosedCase helper", isClosedCase(lostView));

    const disqLead = await db.lead.create({
      data: {
        firstName: "Closed",
        lastName: "DisqAudit",
        email: "closed-disq-audit@test.local",
        phone: "07000000102",
        loanPurpose: "purchase",
        loanAmount: 180_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 300_000,
        propertyLocation: "Manchester",
        timeframe: "90_days",
        formCompleted: false,
        caseStage: "NEW_ENQUIRY",
        operationalQueue: "NEW_LEAD",
        status: "NEW",
      },
    });
    ids.push(disqLead.id);

    await transitionCaseStage(disqLead, "DISQUALIFIED", "Audit — below minimum", {
      status: "DISQUALIFIED",
      disqualifiedReason: DISQUALIFIED_REASONS[1],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
    });

    const disqRow = await db.lead.findUnique({ where: { id: disqLead.id } });
    assert("markDisqualified sets status", disqRow?.status === "DISQUALIFIED", disqRow?.status);
    assert("markDisqualified sets caseStage", disqRow?.caseStage === "DISQUALIFIED", disqRow?.caseStage);
    assert(
      "markDisqualified stores reason",
      disqRow?.disqualifiedReason === DISQUALIFIED_REASONS[1],
      disqRow?.disqualifiedReason,
    );

    const disqView = leadToCase(disqRow!);
    assert("Disqualified visible in closed queue", caseInQueuePage(disqView, "closed"));

    const staleLead = await db.lead.create({
      data: {
        firstName: "Stale",
        lastName: "StageAudit",
        email: "stale-stage-audit@test.local",
        phone: "07000000103",
        loanPurpose: "purchase",
        loanAmount: 200_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 400_000,
        propertyLocation: "Leeds",
        timeframe: "30_days",
        formCompleted: true,
        caseStage: "CONTACTED",
        operationalQueue: "NEW_LEAD",
        status: "LOST",
        lostReason: "No response",
        remindersPaused: true,
      },
    });
    ids.push(staleLead.id);

    const staleView = leadToCase(staleLead);
    assert(
      "status LOST wins over stale caseStage for closed queue",
      staleView.stage === "LOST" && caseInQueuePage(staleView, "closed"),
      staleView.stage,
    );

    assert(
      "Case detail wires markLost",
      readIncludes("src/components/workspace/case-detail.tsx", "markLost: true"),
    );
    assert(
      "Case detail wires markDisqualified",
      readIncludes("src/components/workspace/case-detail.tsx", "markDisqualified: true"),
    );
    assert(
      "API validates lost reasons",
      readIncludes("src/app/api/leads/[id]/route.ts", "LOST_REASONS.includes"),
    );
  } catch (error) {
    assert("Closed workflow audit did not throw", false, String(error));
  } finally {
    for (const id of ids) {
      await db.lead.delete({ where: { id } }).catch(() => null);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\nWorkflow closed-case audit\n");
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
