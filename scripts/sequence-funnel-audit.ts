#!/usr/bin/env npx tsx
/**
 * Sequence funnel stats audit.
 * Run: npm run sequence:funnel
 */
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { db } from "@/lib/db";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS } from "@/lib/case-stages";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import { enrollWinback } from "@/lib/winback-sequence";
import { computeSequenceFunnelStats } from "@/lib/sequence-funnel-stats";
import { SEQUENCE_FLOWS } from "@/lib/sequence-flow-definitions";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function main() {
  const ids: string[] = [];

  try {
    assert("Flow definitions", SEQUENCE_FLOWS.length === 3, String(SEQUENCE_FLOWS.length));

    const nurtureLead = await db.lead.create({
      data: {
        firstName: "Funnel",
        lastName: "Nurture",
        email: `funnel-nurture-${Date.now()}@test.local`,
        phone: "07000000501",
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

    const winbackLead = await db.lead.create({
      data: {
        firstName: "Funnel",
        lastName: "Winback",
        email: `funnel-winback-${Date.now()}@test.local`,
        phone: "07000000502",
        loanPurpose: "purchase",
        loanAmount: 280_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 480_000,
        propertyLocation: "Leeds",
        timeframe: "30_days",
        formCompleted: true,
        status: "CONTACTED",
        caseStage: "CONTACTED",
      },
    });
    ids.push(winbackLead.id);
    await transitionCaseStage(winbackLead, "LOST", "Funnel audit", {
      status: "LOST",
      lostReason: LOST_REASONS[0],
      remindersPaused: true,
      probability: 0,
      expectedValue: 0,
    });
    await enrollWinback((await db.lead.findUnique({ where: { id: winbackLead.id } }))!);

    const leads = await db.lead.findMany();
    const tasks = await db.task.findMany({ where: { completed: false } });
    const { flows, overview } = computeSequenceFunnelStats(leads, tasks);

    const nurture = flows.find((f) => f.id === "long_timeframe_nurture");
    const winback = flows.find((f) => f.id === "lost-standard");

    assert("Overview totals", overview.totalEnrolled >= 2, String(overview.totalEnrolled));
    assert("Nurture enrolled", (nurture?.enrolled ?? 0) >= 1, String(nurture?.enrolled));
    assert("Nurture active", (nurture?.active ?? 0) >= 1, String(nurture?.active));
    assert(
      "Nurture step 2 waiting",
      (nurture?.steps[1]?.waiting ?? 0) >= 1,
      String(nurture?.steps[1]?.waiting),
    );
    assert(
      "Nurture step 1 passed",
      (nurture?.steps[0]?.passed ?? 0) >= 1,
      String(nurture?.steps[0]?.passed),
    );

    assert("Win-back enrolled", (winback?.enrolled ?? 0) >= 1, String(winback?.enrolled));
    assert("Win-back active", (winback?.active ?? 0) >= 1, String(winback?.active));
    assert(
      "Win-back has waiting step",
      winback?.steps.some((s) => s.waiting > 0) === true,
      "no waiting",
    );
    const firstWinbackLabel = winback?.steps[0]?.label ?? "";
    assert(
      "Win-back email subjects",
      firstWinbackLabel.includes("?") || firstWinbackLabel.length > 10,
      firstWinbackLabel,
    );
    assert("Steps have passed field", typeof nurture?.steps[0]?.passed === "number");
    assert("Steps have overflow field", typeof nurture?.steps[0]?.leadsOverflow === "number");
  } catch (error) {
    assert("Funnel audit did not throw", false, String(error));
  } finally {
    for (const id of ids) {
      await db.lead.delete({ where: { id } }).catch(() => null);
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\nSequence funnel audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  if (checks.some((c) => !c.pass)) process.exit(1);
}

main();
