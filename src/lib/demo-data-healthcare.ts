import { db } from "@/lib/db";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import { defaultCaseOwner } from "@/lib/vertical-config";

export const HEALTHCARE_DEMO_DOMAIN = "@demo.bookedconsult.local";

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

const CASES = [
  {
    firstName: "Emma",
    lastName: "Walsh",
    email: `emma.walsh${HEALTHCARE_DEMO_DOMAIN}`,
    phone: "07700901001",
    treatment: "single_implant",
    timeline: "within_3_months",
    postcode: "SW1A 2AA",
    stage: "NEW_ENQUIRY" as const,
    queue: "NEW_LEAD" as const,
    nextAction: "Call patient",
  },
  {
    firstName: "Oliver",
    lastName: "Chen",
    email: `oliver.chen${HEALTHCARE_DEMO_DOMAIN}`,
    phone: "07700901002",
    treatment: "full_arch",
    timeline: "within_3_months",
    postcode: "W1K 6TN",
    stage: "CONTACT_DUE" as const,
    queue: "AWAITING_CALLBACK" as const,
    nextAction: "Call — slot selected, not reserved",
  },
  {
    firstName: "Aisha",
    lastName: "Patel",
    email: `aisha.patel${HEALTHCARE_DEMO_DOMAIN}`,
    phone: "07700901003",
    treatment: "multiple_implants",
    timeline: "3_to_6_months",
    postcode: "EC2A 4NE",
    stage: "CONSULTATION_BOOKED" as const,
    queue: "AWAITING_CALLBACK" as const,
    nextAction: "Confirm consultation attendance",
  },
  {
    firstName: "Tom",
    lastName: "Reed",
    email: `tom.reed${HEALTHCARE_DEMO_DOMAIN}`,
    phone: "07700901004",
    treatment: "single_implant",
    timeline: "within_3_months",
    postcode: "N1 9GU",
    stage: "CONSULTATION_COMPLETED" as const,
    queue: "NEW_LEAD" as const,
    nextAction: "Follow up after consultation",
  },
  {
    firstName: "Lisa",
    lastName: "Grant",
    email: `lisa.grant${HEALTHCARE_DEMO_DOMAIN}`,
    phone: "07700901005",
    treatment: "unsure",
    timeline: "researching",
    postcode: "SE1 7PB",
    stage: "DISQUALIFIED" as const,
    queue: "NEW_LEAD" as const,
    nextAction: "Nurture — researching timeline",
  },
];

export async function clearHealthcareDemoData() {
  const leads = await db.lead.findMany({});
  let removed = 0;
  for (const lead of leads) {
    if (!lead.email.endsWith(HEALTHCARE_DEMO_DOMAIN)) continue;
    await deleteLeadCase(lead.id).catch(() => null);
    removed++;
  }
  return removed;
}

export async function seedHealthcareDemoData(options?: { force?: boolean }) {
  if (options?.force) {
    await clearHealthcareDemoData();
  } else {
    const existing = (await db.lead.findMany({})).filter((l) =>
      l.email.endsWith(HEALTHCARE_DEMO_DOMAIN),
    ).length;
    if (existing > 0) {
      return { seeded: 0, skipped: true, message: "Healthcare demo data already loaded" };
    }
  }

  const owner = defaultCaseOwner();
  let seeded = 0;

  for (const spec of CASES) {
    await db.lead.create({
      data: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        phone: spec.phone,
        loanPurpose: spec.treatment,
        loanAmount: 10_000,
        termMonths: 0,
        propertyType: "consultation",
        propertyValue: 10_000,
        propertyLocation: spec.postcode,
        timeframe: spec.timeline,
        hasExistingMortgage: false,
        willOccupy: false,
        hasEverOccupied: false,
        formCompleted: true,
        qualificationTier: spec.stage === "DISQUALIFIED" ? "disqualified" : "qualified",
        status: spec.stage === "DISQUALIFIED" ? "DISQUALIFIED" : "NEW",
        caseStage: spec.stage,
        operationalQueue: spec.queue,
        owner,
        nextAction: spec.nextAction,
        nextActionAt: minutesAgo(-10),
        callbackDueAt: minutesAgo(-5),
        additionalInfo: `[Healthcare] ${spec.treatment} · ${spec.timeline} · ${spec.postcode} · [DEMO]`,
        source: "healthcare_demo_seed",
        conversationStarted: spec.stage !== "NEW_ENQUIRY",
      },
    });
    seeded++;
  }

  return {
    seeded,
    skipped: false,
    message: `Seeded ${seeded} healthcare demo leads`,
  };
}
