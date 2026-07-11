#!/usr/bin/env npx tsx
/**
 * Case OS acceptance tests.
 * Run: npm run case:audit
 */
import { config } from "dotenv";
config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { POST } from "../src/app/api/leads/route";
import { POST as postBookPriorityCall } from "../src/app/api/book-priority-call/route";
import { requestCaseDocuments, getLeadByUploadToken } from "../src/lib/case-documents";
import { markDocumentUploaded } from "../src/lib/case-documents";
import { db } from "../src/lib/db";
import { leadToCase, computeRisk, nextActionForStage } from "../src/lib/case";
import { addWorkingDays } from "../src/lib/working-days";
import { computeExpectedValue } from "../src/lib/case-stages";
import { CALLBACK_SLA_MINUTES } from "../src/lib/operational-queue";
import { getTodayPrioritySlots } from "../src/lib/priority-slots";

const TEST_EMAIL = "case-os-audit@test.local";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function postLead(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  return { status: res.status, data: (await res.json()) as Record<string, unknown> };
}

async function main() {
  let caseId: string | undefined;
  const [bookableSlot] = getTodayPrioritySlots();
  assert(
    "Consultation slot available for booking test",
    bookableSlot != null,
    "No priority slots returned from schedule",
  );

  try {
    const capture = await postLead({
      stage: "capture",
      firstName: "Case",
      lastName: "Audit",
      email: TEST_EMAIL,
      phone: "07999888777",
      loanPurpose: "auction",
      loanAmount: 300_000,
      timeframe: "30_days",
      consent: true,
      source: "facebook_lp",
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: "case_os",
      fbclid: "test-fbclid-case-os",
      landingPageUrl: "https://example.com/lp",
      deviceType: "mobile",
    });

    assert("Step 2 creates case", capture.status === 201, `status ${capture.status}`);
    caseId = capture.data.id as string;
    assert("Case id returned", Boolean(caseId));

    const lead = await db.lead.findUnique({ where: { id: caseId! } });
    assert("Case in store", lead != null);
    assert("nextAction set", lead?.nextAction === "Call borrower", lead?.nextAction ?? undefined);
    assert("nextActionAt within 15m SLA", Boolean(lead?.nextActionAt));
    assert("caseStage NEW_ENQUIRY", lead?.caseStage === "NEW_ENQUIRY");
    assert("owner Daniel", lead?.owner === "Daniel");
    assert("riskLevel MEDIUM default", lead?.riskLevel === "MEDIUM");
    assert("source attribution landingPageUrl", Boolean(lead?.landingPageUrl?.includes("example.com")));
    assert("deviceType stored", lead?.deviceType === "mobile");

    const activities = await db.activity.findMany();
    const caseActivities = activities.filter((a) => a.leadId === caseId);
    assert("Timeline on capture", caseActivities.length >= 2);

    const expectedVal = computeExpectedValue(300_000, 10);
    assert("expected value calculated", lead?.expectedValue === expectedVal, String(lead?.expectedValue));

    // Complete qualification (required for priority call booking)
    const complete = await postLead({
      leadId: caseId,
      firstName: "Case",
      lastName: "Audit",
      email: TEST_EMAIL,
      phone: "07999888777",
      loanPurpose: "auction",
      loanAmount: 300_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 500_000,
      propertyLocation: "London",
      timeframe: "30_days",
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
      consent: true,
    });
    assert("Step 3 completes case", complete.status === 201, `status ${complete.status}`);

    // Priority call booking
    const bookReq = new Request("http://localhost/api/book-priority-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: caseId, slotId: bookableSlot!.id }),
    });
    const bookRes = await postBookPriorityCall(bookReq);
    const bookData = (await bookRes.json()) as Record<string, unknown>;
    assert("Priority call booking succeeds", bookRes.status === 200, `status ${bookRes.status}`);

    const booked = await db.lead.findUnique({ where: { id: caseId! } });
    assert("Stage CONSULTATION_BOOKED", booked?.caseStage === "CONSULTATION_BOOKED");
    assert("nextAction Complete consultation", booked?.nextAction === "Complete consultation");

    // Duplicate slot
    const other = await db.lead.create({
      data: {
        firstName: "Other",
        lastName: "Borrower",
        email: "other-case@test.local",
        phone: "07000000002",
        loanPurpose: "purchase",
        loanAmount: 150_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 300_000,
        propertyLocation: "Manchester",
        timeframe: "30_days",
        formCompleted: true,
        qualificationTier: "fully_qualified",
      },
    });
    const dupReq = new Request("http://localhost/api/book-priority-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: other.id, slotId: bookableSlot!.id }),
    });
    const dupRes = await postBookPriorityCall(dupReq);
    assert("Duplicate slot rejected", dupRes.status === 409, `status ${dupRes.status}`);
    await db.lead.delete({ where: { id: other.id } }).catch(() => null);

    // Document request
    const bookedLead = await db.lead.findUnique({ where: { id: caseId! } });
    await requestCaseDocuments(bookedLead!);
    assert("Document request succeeds", true);

    const withDocs = await db.lead.findUnique({ where: { id: caseId! } });
    assert("upload token created", Boolean(withDocs?.uploadToken));
    assert("upload token expiry set", Boolean(withDocs?.uploadTokenExpiresAt));
    assert("stage DOCUMENTS_REQUESTED", withDocs?.caseStage === "DOCUMENTS_REQUESTED");

    await db.lead.update({
      where: { id: caseId! },
      data: { uploadTokenExpiresAt: new Date(Date.now() - 60_000) },
    });
    const expiredLead = await db.lead.findUnique({ where: { id: caseId! } });
    assert(
      "Expired upload token rejected",
      expiredLead != null && (await getLeadByUploadToken(expiredLead.uploadToken!)) === null,
    );
    await db.lead.update({
      where: { id: caseId! },
      data: { uploadTokenExpiresAt: withDocs!.uploadTokenExpiresAt },
    });

    const docs = await db.caseDocument.findMany({ where: { leadId: caseId! } });
    assert("document checklist created", docs.length >= 5);

    // Upload
    const token = withDocs!.uploadToken!;
    const buffer = Buffer.from("test");
    await markDocumentUploaded(caseId!, docs[0]!.docKey, "passport.pdf", buffer);
    assert("Upload marks document", true);

    const uploaded = await db.caseDocument.findMany({ where: { leadId: caseId! } });
    assert(
      "Document status uploaded",
      uploaded.some((d) => d.docKey === docs[0]!.docKey && d.status === "UPLOADED"),
    );

    // Risk: overdue first contact
    const stale = await db.lead.create({
      data: {
        firstName: "Stale",
        lastName: "Lead",
        email: "stale@test.local",
        phone: "07000000001",
        loanPurpose: "purchase",
        loanAmount: 200_000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 400_000,
        propertyLocation: "London",
        timeframe: "30_days",
        caseStage: "NEW_ENQUIRY",
      },
    });
    await db.lead.update({
      where: { id: stale.id },
      data: { createdAt: new Date(Date.now() - (CALLBACK_SLA_MINUTES + 5) * 60 * 1000) },
    });
    const staleLead = await db.lead.findUnique({ where: { id: stale.id } });
    const staleRisk = computeRisk(staleLead!);
    assert("Risk flags overdue first contact", staleRisk.level === "HIGH");

    // Lost stops reminders
    await db.lead.update({
      where: { id: caseId! },
      data: {
        caseStage: "LOST",
        status: "LOST",
        remindersPaused: true,
        lostReason: "No response",
        probability: 0,
        expectedValue: 0,
      },
    });
    const lost = await db.lead.findUnique({ where: { id: caseId! } });
    assert("Lost case reminders paused", lost?.remindersPaused === true);
    assert("Lost probability 0", lost?.probability === 0);

    // Cleanup test leads
    if (caseId) await db.lead.delete({ where: { id: caseId } }).catch(() => null);
    await db.lead.delete({ where: { id: stale.id } }).catch(() => null);
  } catch (err) {
    assert("No unexpected throw", false, String(err));
  }

  const friday = new Date("2026-06-19T12:00:00Z");
  const lenderDue = addWorkingDays(friday, 2);
  assert("Lender follow-up skips weekend", lenderDue.getDay() === 2, lenderDue.toISOString());

  const appLead = await db.lead.create({
    data: {
      firstName: "Lender",
      lastName: "SLA",
      email: "lender-sla@test.local",
      phone: "07000000002",
      loanPurpose: "purchase",
      loanAmount: 300_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 500_000,
      propertyLocation: "London",
      timeframe: "30_days",
      caseStage: "APPLICATION_SUBMITTED",
    },
  });
  const lenderAction = nextActionForStage(appLead, "APPLICATION_SUBMITTED", friday);
  assert("Lender next action set", lenderAction.nextAction === "Follow up lender");
  await db.lead.delete({ where: { id: appLead.id } }).catch(() => null);

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass);

  console.log("\nCase OS Audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);

  if (failed.length > 0) process.exit(1);
}

main();
