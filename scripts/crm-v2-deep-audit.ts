#!/usr/bin/env npx tsx
/**
 * CRM v2 behavioral + unit audit — queue logic, notifications, completion lifecycle.
 *
 * Run: npm run crm-v2:deep-audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true });
}

process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";
if (!process.env.WORKSPACE_SECRET) {
  process.env.WORKSPACE_SECRET = "crm-v2-deep-audit-secret";
}

import { POST as postLead } from "@/app/api/leads/route";
import { PATCH as patchLead } from "@/app/api/leads/[id]/route";
import { leadToCase } from "@/lib/case";
import { db } from "@/lib/db";
import { isLeadCompleted } from "@/lib/lead-completion";
import type { Lead } from "@/generated/prisma/client";
import {
  caseInOperationalQueue,
  hasInitialInvoicePaid,
  isFollowUpActive,
  isFollowUpOverdue,
} from "@/lib/workspace-case";

type Check = { id: string; phase: string; pass: boolean; detail?: string };

const checks: Check[] = [];
const cleanupIds: string[] = [];
const root = process.cwd();

function check(id: string, phase: string, pass: boolean, detail?: string) {
  checks.push({ id, phase, pass, detail });
  console.log(`${pass ? "✓" : "✗"} [${phase}] ${id}${detail ? ` — ${detail}` : ""}`);
}

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function caseFrom(overrides: Partial<Lead>) {
  const base = {
    id: "audit-case",
    firstName: "Audit",
    lastName: "Lead",
    email: "audit-case@test.local",
    phone: "07123456789",
    loanPurpose: "purchase",
    loanAmount: 250_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 350_000,
    propertyLocation: "London",
    timeframe: "30_days",
    status: "NEW",
    caseStage: "NEW",
    operationalQueue: "NEW_LEAD",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    conversationStarted: false,
    initialInvoiceAmount: null,
    revenueGenerated: null,
    nextActionAt: null,
    callbackDueAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Lead;
  return leadToCase({ ...base, ...overrides } as Lead);
}

async function postLeadJson(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await postLead(req);
  return { status: res.status, data: (await res.json()) as Record<string, unknown> };
}

function authedPatch(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/leads/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: `workspace_token=${process.env.WORKSPACE_SECRET}`,
    },
    body: JSON.stringify(body),
  });
}

function brokerSmsLogged(leadId: string, activities: Awaited<ReturnType<typeof db.activity.findMany>>) {
  return activities
    .filter((a) => a.leadId === leadId)
    .some((a) => a.description.includes("Broker new-lead SMS"));
}

async function activitiesForLead(leadId: string) {
  return (await db.activity.findMany()).filter((a) => a.leadId === leadId);
}

async function waitForBrokerSms(leadId: string, timeoutMs = 4000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (brokerSmsLogged(leadId, await activitiesForLead(leadId))) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

function runQueueUnitTests() {
  console.log("\n── Phase 1: Queue logic (unit) ──\n");

  const partial = caseFrom({
    formCompleted: false,
    qualificationTier: "partial",
    operationalQueue: "NEW_LEAD",
  });
  check(
    "Q-01",
    "Queue",
    !caseInOperationalQueue(partial, "NEW_LEAD"),
    "partial step-2 excluded from New Leads inbox",
  );

  const qualifiedNew = caseFrom({
    formCompleted: true,
    operationalQueue: "NEW_LEAD",
    conversationStarted: false,
  });
  check(
    "Q-02",
    "Queue",
    caseInOperationalQueue(qualifiedNew, "NEW_LEAD"),
    "qualified uncontacted in New Leads",
  );

  const followUp = caseFrom({
    operationalQueue: "AWAITING_CALLBACK",
    status: "CONTACTED",
    conversationStarted: true,
  });
  check("Q-03", "Queue", isFollowUpActive(followUp), "active follow-up before invoice");
  check(
    "Q-04",
    "Queue",
    !caseInOperationalQueue(followUp, "NEW_LEAD"),
    "contacted lead not in New Leads",
  );

  const paidFollowUp = caseFrom({
    operationalQueue: "AWAITING_CALLBACK",
    initialInvoiceAmount: 500,
    status: "WON",
    caseStage: "COMPLETED",
  });
  check("Q-05", "Queue", !isFollowUpActive(paidFollowUp), "invoice paid exits follow-up");
  check(
    "Q-06",
    "Queue",
    hasInitialInvoicePaid(paidFollowUp),
    "invoice paid counts as completed economics",
  );

  const yesterday = new Date(Date.now() - 86_400_000);
  const overdue = caseFrom({
    operationalQueue: "AWAITING_CALLBACK",
    status: "CONTACTED",
    nextActionAt: yesterday,
  });
  check(
    "Q-07",
    "Queue",
    isFollowUpOverdue(overdue),
    "past due follow-up is overdue",
  );

  const tomorrow = new Date(Date.now() + 86_400_000);
  const notOverdue = caseFrom({
    operationalQueue: "AWAITING_CALLBACK",
    status: "CONTACTED",
    nextActionAt: tomorrow,
  });
  check(
    "Q-08",
    "Queue",
    !isFollowUpOverdue(notOverdue),
    "future follow-up not overdue",
  );

  const dq = caseFrom({
    caseStage: "DISQUALIFIED",
    status: "DISQUALIFIED",
    operationalQueue: "NEW_LEAD",
  });
  check(
    "Q-09",
    "Queue",
    !caseInOperationalQueue(dq, "NEW_LEAD") && !isFollowUpActive(dq),
    "disqualified excluded from active queues",
  );
}

function runCompletionUnitTests() {
  console.log("\n── Phase 2: Completion helpers (unit) ──\n");

  const open = {
    initialInvoiceAmount: null,
    caseStage: "CONTACTED",
    status: "CONTACTED",
  } as Lead;
  check("C-01", "Completion", !isLeadCompleted(open), "open lead not completed");

  const invoiced = {
    initialInvoiceAmount: 1500,
    caseStage: "CONTACTED",
    status: "CONTACTED",
  } as Lead;
  check("C-02", "Completion", isLeadCompleted(invoiced), "initial invoice marks completed");

  const won = {
    initialInvoiceAmount: null,
    caseStage: "COMPLETED",
    status: "WON",
  } as Lead;
  check("C-03", "Completion", isLeadCompleted(won), "WON/COMPLETED stage counts");
}

function runStaticRegression() {
  console.log("\n── Phase 3: Static regression ──\n");

  const metaCapture = read("src/lib/meta-capture-notifications.ts");
  check(
    "R-01",
    "Static",
    !metaCapture.includes("sendBrokerNewLeadAlert"),
    "Meta partial ingest silent for broker SMS",
  );

  const caseDetail = read("src/components/workspace/case-detail.tsx");
  check(
    "R-02",
    "Static",
    !caseDetail.includes("Start booking chase"),
    "manual booking chase button removed",
  );
  check(
    "R-03",
    "Static",
    caseDetail.includes("Auto nudge active"),
    "background booking chase indicator kept",
  );

  const chase = read("src/lib/qualified-booking-chase.ts");
  check(
    "R-04",
    "Static",
    chase.includes("maybeEnrollBookingChaseAfterNoAnswer"),
    "auto booking chase after 2× no-answer wired",
  );

  const operational = read("src/app/api/workspace/operational/route.ts");
  check(
    "R-05",
    "Static",
    operational.includes("invoiceThisMonth") && operational.includes("commissionThisMonth"),
    "Home KPI split: invoice vs commission",
  );
  check(
    "R-06",
    "Static",
    operational.includes("hasInitialInvoicePaid(c)") && operational.includes("revenueGenerated"),
    "commission KPI requires initial invoice paid",
  );

  const leadsPost = read("src/app/api/leads/route.ts");
  const dqBlock = leadsPost.split("if (!qualification.qualified)")[1]?.split("let metaSource")[0] ?? "";
  check(
    "R-07",
    "Static",
    dqBlock.includes('caseStage: "DISQUALIFIED"') &&
      dqBlock.includes("remindersPaused: true") &&
      !dqBlock.includes("sendBrokerNewLeadAlert"),
    "DQ silent + archived fields",
  );
  check(
    "R-08",
    "Static",
    caseDetail.includes("parseMoneyInput") &&
      caseDetail.includes("e.currentTarget.value") &&
      caseDetail.includes("initialInvoiceAmount: parseMoneyInput"),
    "invoice blur reads input value (no stale state)",
  );
  check(
    "R-09",
    "Static",
    caseDetail.includes("revenueGenerated: parseMoneyInput"),
    "commission blur reads input value",
  );

  const leadsPatch = read("src/app/api/leads/[id]/route.ts");
  check(
    "R-10",
    "Static",
    leadsPatch.includes("hasInitialInvoiceRecorded") &&
      leadsPatch.includes("coerceMoneyField"),
    "invoice API auto-complete + money coercion",
  );
}

async function runNotificationBehavior() {
  console.log("\n── Phase 4: Notification routing (behavioral) ──\n");

  const suffix = Date.now();
  const captureEmail = `crm-v2-deep-capture-${suffix}@test.local`;
  const dqEmail = `crm-v2-deep-dq-${suffix}@test.local`;

  const base = {
    firstName: "Deep",
    lastName: "Audit",
    phone: "07111222333",
    loanPurpose: "auction",
    loanAmount: 250_000,
    timeframe: "30_days",
    consent: true as const,
    source: "landing_page",
  };

  let captureId: string | undefined;
  try {
    const capture = await postLeadJson({
      stage: "capture",
      email: captureEmail,
      ...base,
    });
    check("N-01", "Notify", capture.status === 201 && capture.data.captured === true, `status ${capture.status}`);
    captureId = capture.data.id as string | undefined;
    if (captureId) cleanupIds.push(captureId);

    if (captureId) {
      const activities = await activitiesForLead(captureId);
      check(
        "N-02",
        "Notify",
        !brokerSmsLogged(captureId, activities),
        "step 2 capture: no broker SMS",
      );
      check(
        "N-03",
        "Notify",
        activities.some((a) => a.description.includes("Capture SMS")),
        "step 2 borrower capture SMS still sent",
      );

      const partial = await db.lead.findUnique({ where: { id: captureId } });
      check(
        "N-04",
        "Notify",
        partial != null && !caseInOperationalQueue(leadToCase(partial), "NEW_LEAD"),
        "partial capture not in New Leads feed",
      );
    }

    const complete = await postLeadJson({
      leadId: captureId,
      email: captureEmail,
      ...base,
      propertyType: "residential",
      propertyLocation: "London SW1",
      propertyValue: 350_000,
      termMonths: 12,
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
    });
    check(
      "N-05",
      "Notify",
      complete.status === 201 && complete.data.success === true,
      `step 3 qualified status ${complete.status}`,
    );

    if (captureId) {
      check(
        "N-06",
        "Notify",
        await waitForBrokerSms(captureId),
        "step 3 Google qualified: broker SMS logged",
      );

      const lead = await db.lead.findUnique({ where: { id: captureId } });
      check("N-07", "Notify", lead?.formCompleted === true, "qualified formCompleted=true");
      check(
        "N-08",
        "Notify",
        lead != null && caseInOperationalQueue(leadToCase(lead), "NEW_LEAD"),
        "qualified lead in New Leads inbox",
      );
    }

    const dq = await postLeadJson({
      email: dqEmail,
      ...base,
      propertyType: "residential",
      propertyLocation: "Manchester",
      propertyValue: 350_000,
      termMonths: 12,
      hasExistingMortgage: false,
      willOccupy: true,
      hasEverOccupied: false,
    });
    check(
      "N-09",
      "Notify",
      dq.status === 422 && dq.data.disqualified === true,
      `DQ status ${dq.status}`,
    );

    const dqLead = (await db.lead.findMany()).find((l) => l.email === dqEmail);
    if (dqLead) {
      cleanupIds.push(dqLead.id);
      const dqActivities = await activitiesForLead(dqLead.id);
      check(
        "N-10",
        "Notify",
        !brokerSmsLogged(dqLead.id, dqActivities),
        "disqualified: no broker SMS",
      );
      check(
        "N-11",
        "Notify",
        dqLead.caseStage === "DISQUALIFIED" && dqLead.remindersPaused === true,
        "DQ archived with reminders paused",
      );
    } else {
      check("N-10", "Notify", false, "DQ lead not saved");
      check("N-11", "Notify", false, "DQ lead not saved");
    }
  } catch (err) {
    check("N-00", "Notify", false, err instanceof Error ? err.message : "notification tests failed");
  }
}

async function runCompletionApiBehavior() {
  console.log("\n── Phase 5: Completion lifecycle (API) ──\n");

  let leadId: string | undefined;
  try {
    const lead = await db.lead.create({
      data: {
        firstName: "Complete",
        lastName: "Lifecycle",
        email: `crm-v2-deep-complete-${Date.now()}@test.local`,
        phone: "07222333444",
        loanPurpose: "purchase",
        loanAmount: 300_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 450_000,
        propertyLocation: "Leeds",
        timeframe: "30_days",
        formCompleted: true,
        qualificationTier: "fully_qualified",
        status: "CONTACTED",
        caseStage: "CONTACTED",
        operationalQueue: "AWAITING_CALLBACK",
        conversationStarted: true,
        nextActionAt: new Date(Date.now() + 86_400_000),
      },
    });
    leadId = lead.id;
    cleanupIds.push(leadId);

    const created = await db.lead.findUnique({ where: { id: leadId } });
    check("L-00", "Lifecycle", created != null, "fixture lead persisted");

    const invoiceRes = await patchLead(authedPatch(leadId, { initialInvoiceAmount: 2500 }), {
      params: Promise.resolve({ id: leadId }),
    });
    const invoiceBody = (await invoiceRes.json()) as Lead;
    check(
      "L-01",
      "Lifecycle",
      invoiceRes.status === 200 && invoiceBody.operationalQueue === "COMPLETION",
      `PATCH invoice → ${invoiceBody.operationalQueue ?? invoiceRes.status}`,
    );
    check(
      "L-02",
      "Lifecycle",
      invoiceBody.status === "WON" && invoiceBody.caseStage === "COMPLETED",
      "auto-complete sets WON + COMPLETED",
    );
    check(
      "L-03",
      "Lifecycle",
      (invoiceBody.initialInvoiceAmount ?? 0) === 2500,
      "initial invoice amount saved",
    );

    const reopenRes = await patchLead(
      authedPatch(leadId, { reopenToFollowUp: true, followUpPreset: "1d" }),
      { params: Promise.resolve({ id: leadId }) },
    );
    const reopened = (await reopenRes.json()) as Lead;
    check(
      "L-04",
      "Lifecycle",
      reopenRes.status === 200 && reopened.operationalQueue === "AWAITING_CALLBACK",
      `reopen → ${reopened.operationalQueue ?? reopenRes.status}`,
    );
    check(
      "L-05",
      "Lifecycle",
      reopened.initialInvoiceAmount == null && reopened.status === "CONTACTED",
      "reopen clears invoice + WON",
    );

    const rescheduleRes = await patchLead(
      authedPatch(leadId, { rescheduleFollowUp: true, followUpPreset: "3d" }),
      { params: Promise.resolve({ id: leadId }) },
    );
    const rescheduled = (await rescheduleRes.json()) as Lead;
    check(
      "L-06",
      "Lifecycle",
      rescheduleRes.status === 200 && rescheduled.operationalQueue === "AWAITING_CALLBACK",
      "reschedule stays in follow-up",
    );
    check(
      "L-07",
      "Lifecycle",
      rescheduled.nextActionAt != null,
      "reschedule sets nextActionAt",
    );

    const contactedRes = await patchLead(
      authedPatch(leadId, { markContacted: true, followUpPreset: "1d" }),
      { params: Promise.resolve({ id: leadId }) },
    );
    check(
      "L-08",
      "Lifecycle",
      contactedRes.status === 200,
      "mark contacted still works post-reopen",
    );

    const commissionRes = await patchLead(
      authedPatch(leadId, { revenueGenerated: 1200 }),
      { params: Promise.resolve({ id: leadId }) },
    );
    const withCommission = (await commissionRes.json()) as Lead;
    check(
      "L-09",
      "Lifecycle",
      commissionRes.status === 200 && (withCommission.revenueGenerated ?? 0) === 1200,
      "commission saved after reopen",
    );

    const legacyLead = await db.lead.create({
      data: {
        firstName: "Legacy",
        lastName: "Won",
        email: `crm-v2-deep-legacy-${Date.now()}@test.local`,
        phone: "07333444555",
        loanPurpose: "purchase",
        loanAmount: 200_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 400_000,
        propertyLocation: "Bristol",
        timeframe: "30_days",
        formCompleted: true,
        qualificationTier: "fully_qualified",
        status: "WON",
        caseStage: "COMPLETED",
        operationalQueue: "COMPLETION",
        initialInvoiceAmount: null,
      },
    });
    cleanupIds.push(legacyLead.id);

    const legacyInvoiceRes = await patchLead(
      authedPatch(legacyLead.id, { initialInvoiceAmount: 1800 }),
      { params: Promise.resolve({ id: legacyLead.id }) },
    );
    const legacyInvoiced = (await legacyInvoiceRes.json()) as Lead;
    check(
      "L-10",
      "Lifecycle",
      legacyInvoiceRes.status === 200 && (legacyInvoiced.initialInvoiceAmount ?? 0) === 1800,
      "invoice on legacy WON lead without prior amount",
    );
  } catch (err) {
    check("L-00", "Lifecycle", false, err instanceof Error ? err.message : "lifecycle tests failed");
  }
}

async function cleanup() {
  for (const id of cleanupIds) {
    await db.lead.delete({ where: { id } }).catch(() => {});
  }
  for (const email of [
    "crm-v2-deep-capture@test.local",
    "crm-v2-deep-dq@test.local",
    "crm-v2-deep-complete@test.local",
  ]) {
    const orphans = (await db.lead.findMany()).filter((l) => l.email === email);
    for (const lead of orphans) {
      await db.lead.delete({ where: { id: lead.id } }).catch(() => {});
    }
  }
}

async function main() {
  console.log("\nBLB CRM v2 deep audit\n");

  runQueueUnitTests();
  runCompletionUnitTests();
  runStaticRegression();
  await runCompletionApiBehavior();
  await runNotificationBehavior();
  await cleanup();

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\n── Summary ──\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
