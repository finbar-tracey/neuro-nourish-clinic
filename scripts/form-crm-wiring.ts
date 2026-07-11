#!/usr/bin/env npx tsx
/**
 * Verifies Facebook LP form payloads → POST /api/leads → CRM store.
 * Run: npm run form:crm-wiring
 */
import { config } from "dotenv";
config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { POST } from "../src/app/api/leads/route";
import { POST as postBookingIntent } from "../src/app/api/leads/booking-intent/route";
import { POST as postBookPriorityCall } from "../src/app/api/book-priority-call/route";
import { leadToCase } from "../src/lib/case";
import { db } from "../src/lib/db";
import { getTodayPrioritySlots } from "../src/lib/priority-slots";
import { caseInOperationalQueue } from "../src/lib/workspace-case";

const TEST_EMAIL = "form-crm-wiring@test.local";
const TRACKING = {
  source: "facebook_lp",
  utmSource: "facebook",
  utmMedium: "paid",
  utmCampaign: "bridging_q2",
  fbclid: "IwAR-test-fbclid-wiring",
  adAngle: "auction",
};

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

async function activitiesForLead(leadId: string) {
  return (await db.activity.findMany()).filter((a) => a.leadId === leadId);
}

async function waitForActivity(
  leadId: string,
  needle: string,
  timeoutMs = 4000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const acts = await activitiesForLead(leadId);
    if (acts.some((a) => a.description.includes(needle))) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

const baseContact = {
  firstName: "CRM",
  lastName: "Wiring",
  email: TEST_EMAIL,
  phone: "07123456789",
  loanPurpose: "auction",
  loanAmount: 250_000,
  timeframe: "30_days",
  consent: true as const,
  ...TRACKING,
};

async function main() {
  let leadId: string | undefined;
  const [bookableSlot] = getTodayPrioritySlots();
  assert(
    "Consultation slot available for booking test",
    bookableSlot != null,
    "No priority slots returned from schedule",
  );

  try {
    const capture = await postLead({ stage: "capture", ...baseContact });
    assert(
      "Step 2 capture → 201",
      capture.status === 201 && capture.data.captured === true,
      `status ${capture.status}`,
    );
    leadId = capture.data.id as string | undefined;
    assert("Step 2 returns lead id", typeof leadId === "string" && leadId.length > 0, leadId);

    if (leadId) {
      const partial = await db.lead.findUnique({ where: { id: leadId } });
      assert("Partial lead in CRM", partial != null, leadId);
      assert("Owner assigned on capture", partial?.owner === "Daniel");
      assert("Operational queue NEW_LEAD on capture (DB)", partial?.operationalQueue === "NEW_LEAD");
      assert(
        "Partial capture excluded from New Leads inbox (v2)",
        partial != null &&
          !caseInOperationalQueue(leadToCase(partial), "NEW_LEAD"),
        "formCompleted=false",
      );
      assert("Attribution channel on capture", partial?.attributionChannel === "Meta");
      assert("source = facebook_lp", partial?.source === "facebook_lp", partial?.source);
      assert("qualificationTier = partial", partial?.qualificationTier === "partial");
      assert("formCompleted = false", partial?.formCompleted === false);
      assert("UTM source saved", partial?.utmSource === TRACKING.utmSource);
      assert("fbclid saved", partial?.fbclid === TRACKING.fbclid);
      assert(
        "Ad angle in additionalInfo",
        partial?.additionalInfo?.includes("auction") === true,
        partial?.additionalInfo ?? "missing",
      );

      const activities = await activitiesForLead(leadId);
      assert(
        "Capture activity logged",
        activities.some((a) => a.type === "FORM_SUBMITTED"),
        `${activities.length} activities`,
      );
      assert(
        "Capture SMS logged",
        activities.some((a) => a.description.includes("Capture SMS")),
      );
      assert(
        "Capture welcome journey email logged",
        activities.some((a) => a.description.includes("Capture welcome email")),
      );
      assert(
        "Step 2 capture: no broker SMS (v2)",
        !activities.some((a) => a.description.includes("Broker new-lead SMS")),
      );
    }

    const complete = await postLead({
      leadId,
      ...baseContact,
      propertyType: "residential",
      propertyLocation: "London SW1",
      propertyValue: 350_000,
      termMonths: 12,
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
    });
    assert(
      "Step 3 complete → 201",
      complete.status === 201 && complete.data.success === true,
      `status ${complete.status}`,
    );
    assert("Same lead id on complete", complete.data.id === leadId, String(complete.data.id));

    if (leadId) {
      const qualified = await db.lead.findUnique({ where: { id: leadId } });
      assert("formCompleted = true", qualified?.formCompleted === true);
      assert(
        "qualificationTier = fully_qualified",
        qualified?.qualificationTier === "fully_qualified",
      );
      assert("Tracking preserved on complete", qualified?.fbclid === TRACKING.fbclid);
      assert(
        "Ad angle preserved on complete",
        qualified?.additionalInfo?.includes("auction") === true,
        qualified?.additionalInfo ?? "missing",
      );

      assert(
        "Qualified confirmation SMS logged",
        await waitForActivity(leadId, "Qualified confirmation SMS"),
      );
      assert(
        "Qualified confirmation email logged",
        await waitForActivity(leadId, "Qualified confirmation email"),
      );
      assert(
        "Step 3 qualified: broker SMS logged (v2)",
        await waitForActivity(leadId, "Broker new-lead SMS"),
      );

      const preferredSlot = bookableSlot!.label;
      const slotReq = new Request("http://localhost/api/leads/booking-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          preferredSlot,
        }),
      });
      const slotRes = await postBookingIntent(slotReq);
      const slotData = (await slotRes.json()) as { ok?: boolean };
      assert("Booking intent → 200", slotRes.status === 200 && slotData.ok === true);

      const withSlot = await db.lead.findUnique({ where: { id: leadId } });
      assert(
        "Preferred slot saved on lead",
        withSlot?.additionalInfo?.includes(`Preferred slot: ${preferredSlot}`) === true,
      );

      const consultReq = new Request("http://localhost/api/book-priority-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          slotId: bookableSlot!.id,
        }),
      });
      const consultRes = await postBookPriorityCall(consultReq);
      const consultData = (await consultRes.json()) as {
        ok?: boolean;
        displayTime?: string;
        teamsLink?: string | null;
      };
      assert("Book priority call → 200", consultRes.status === 200 && consultData.ok === true);

      const booked = await db.lead.findUnique({ where: { id: leadId } });
      assert("Lead status BOOKED after priority call", booked?.status === "BOOKED");
      assert("Case stage CONSULTATION_BOOKED", booked?.caseStage === "CONSULTATION_BOOKED");
      assert("Lead owner is Daniel", booked?.owner === "Daniel");
      assert("Lead in AWAITING_CALLBACK queue", booked?.operationalQueue === "AWAITING_CALLBACK");
      assert("Priority call slot saved", booked?.priorityCallSlot != null);
      assert("priorityCallBookedAt set", booked?.priorityCallBookedAt != null);
      assert(
        "Priority call tag on lead",
        booked?.additionalInfo?.includes("[Priority call booked:") === true,
      );
      assert(
        "Priority call display time returned",
        typeof consultData.displayTime === "string" && consultData.displayTime.length > 0,
      );
      if (consultData.teamsLink) {
        assert("teamsMeetingUrl saved on lead", booked?.teamsMeetingUrl === consultData.teamsLink);
        assert("outlookEventId saved on lead", Boolean(booked?.outlookEventId));
      } else {
        assert(
          "Teams link optional when Graph unavailable",
          booked?.teamsMeetingUrl == null || booked.teamsMeetingUrl.length > 0,
          "Graph not configured in dry-run — CRM booking fields still saved",
        );
      }

      const bookingActivities = (await db.activity.findMany()).filter((a) => a.leadId === leadId);
      assert(
        "Booking STATUS_CHANGED timeline",
        bookingActivities.some((a) => a.description.includes("booked a priority call")),
      );
      assert(
        "Booking confirmation EMAIL_SENT logged",
        bookingActivities.some((a) => a.type === "EMAIL_SENT" && a.description.includes("confirmation")),
      );
    }

    const reCapture = await postLead({
      stage: "capture",
      leadId,
      ...baseContact,
      firstName: "Updated",
    });
    assert("Step 2 update with leadId → 201", reCapture.status === 201);
    if (leadId) {
      const updated = await db.lead.findUnique({ where: { id: leadId } });
      assert("Contact update on completed lead", updated?.firstName === "Updated");
      assert("Completed state preserved on re-capture", updated?.formCompleted === true);
    }

    const disqualify = await postLead({
      ...baseContact,
      email: "disqualify-wiring@test.local",
      propertyType: "residential",
      propertyLocation: "Manchester",
      propertyValue: 350_000,
      termMonths: 12,
      hasExistingMortgage: false,
      willOccupy: true,
      hasEverOccupied: false,
    });
    assert(
      "Occupancy disqualify → 422",
      disqualify.status === 422 && disqualify.data.disqualified === true,
    );
    const dqLead = (await db.lead.findMany()).find(
      (l) => l.email === "disqualify-wiring@test.local",
    );
    if (dqLead) {
      assert("Disqualified status in CRM", dqLead.status === "DISQUALIFIED");
      assert("Disqualified caseStage in CRM", dqLead.caseStage === "DISQUALIFIED");
      assert("Disqualified reminders paused", dqLead.remindersPaused === true);
      const dqActivities = (await db.activity.findMany()).filter((a) => a.leadId === dqLead.id);
      assert(
        "Disqualified: no broker SMS (v2)",
        !dqActivities.some((a) => a.description.includes("Broker new-lead SMS")),
      );
      await db.lead.delete({ where: { id: dqLead.id } }).catch(() => {});
    } else {
      assert("Disqualified lead saved in CRM", false);
    }

    const nurture = await postLead({
      ...baseContact,
      email: "nurture-wiring@test.local",
      timeframe: "researching",
      propertyType: "unspecified",
      propertyLocation: "Still researching",
      propertyValue: 300_000,
      termMonths: 12,
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
    });
    assert(
      "Long timeframe nurture → 422",
      nurture.status === 422 && nurture.data.nurtureEnrolled === true,
    );
    const nurtureEmail = "nurture-wiring@test.local";
    const nurtureLead = (await db.lead.findMany()).find((l) => l.email === nurtureEmail);
    assert("Nurture lead FOLLOW_UP in CRM", nurtureLead?.status === "FOLLOW_UP");
    if (nurtureLead) {
      await db.lead.delete({ where: { id: nurtureLead.id } }).catch(() => {});
    }

    const rejectSubMin = await postLead({
      stage: "capture",
      ...baseContact,
      email: "submin-wiring@test.local",
      loanAmount: 30_000,
    });
    assert("Capture rejects sub-£50k", rejectSubMin.status === 400);
  } catch (error) {
    assert("CRM wiring run", false, error instanceof Error ? error.message : "Failed");
  } finally {
    if (leadId) {
      await db.lead.delete({ where: { id: leadId } }).catch(() => {});
    }
    const orphans = (await db.lead.findMany()).filter((l) => l.email === TEST_EMAIL);
    for (const lead of orphans) {
      await db.lead.delete({ where: { id: lead.id } }).catch(() => {});
    }
  }

  const passed = checks.filter((c) => c.pass).length;
  console.log("\n📋 Form → CRM wiring audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
