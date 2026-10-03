import type { CaseStage, Lead, OperationalQueue, RiskLevel } from "@/generated/prisma/client";
import { BRIDGING_DOCUMENT_TEMPLATE } from "@/lib/document-checklist";
import { PRIORITY_CALL_BOOKED_PREFIX } from "@/lib/lead-tags";
import { computeExpectedCommission, computeExpectedValue, STAGE_PROBABILITY } from "@/lib/case-stages";
import {
  clearNeuronourishDemoData,
  seedNeuronourishDemoData,
} from "@/lib/demo-data-neuronourish";
import { isNeuronourish } from "@/lib/vertical-config";
import { db } from "@/lib/db";

export const DEMO_EMAIL_DOMAIN = "@demo.blb.local";
const DEMO_TAG = "[DEMO]";

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

function hoursAgo(h: number) {
  return minutesAgo(h * 60);
}

function daysAgo(d: number) {
  return hoursAgo(d * 24);
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

type DemoCase = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanPurpose: string;
  loanAmount: number;
  propertyLocation: string;
  timeframe: string;
  source: string;
  attributionChannel: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbclid?: string;
  formCompleted: boolean;
  qualificationTier: string | null;
  status: Lead["status"];
  caseStage: CaseStage;
  operationalQueue: OperationalQueue;
  nextAction: string;
  nextActionAt: Date;
  callbackDueAt?: Date | null;
  riskLevel: RiskLevel;
  riskReason: string;
  probability: number;
  conversationStarted: boolean;
  firstResponseAt?: Date | null;
  responseTimeMinutes?: number | null;
  priorityCallSlot?: string | null;
  priorityCallBookedAt?: Date | null;
  consultationCompletedAt?: Date | null;
  documentsRequestedAt?: Date | null;
  uploadToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  additionalInfo?: string | null;
  withDocuments?: "partial" | "full";
};

const BASE = {
  termMonths: 12,
  propertyType: "residential",
  propertyValue: 650_000,
  hasExistingMortgage: false,
  willOccupy: false,
  hasEverOccupied: false,
};

const DEMO_CASES: DemoCase[] = [
  {
    firstName: "James",
    lastName: "O'Connor",
    email: `james.oconnor${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900101",
    loanPurpose: "auction",
    loanAmount: 425_000,
    propertyLocation: "Manchester",
    timeframe: "14_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "auction_q2",
    fbclid: "demo-fb-001",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "NEW",
    caseStage: "NEW_ENQUIRY",
    operationalQueue: "NEW_LEAD",
    nextAction: "Call borrower",
    nextActionAt: minutesAgo(-8),
    callbackDueAt: minutesAgo(-8),
    riskLevel: "MEDIUM",
    riskReason: "Awaiting first contact",
    probability: STAGE_PROBABILITY.NEW_ENQUIRY,
    conversationStarted: false,
    createdAt: minutesAgo(7),
    updatedAt: minutesAgo(7),
  },
  {
    firstName: "Sarah",
    lastName: "Mitchell",
    email: `sarah.mitchell${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900102",
    loanPurpose: "purchase",
    loanAmount: 890_000,
    propertyLocation: "London SW1",
    timeframe: "30_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "purchase_london",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "NEW",
    caseStage: "NEW_ENQUIRY",
    operationalQueue: "NEW_LEAD",
    nextAction: "Call borrower",
    nextActionAt: minutesAgo(22),
    callbackDueAt: minutesAgo(22),
    riskLevel: "HIGH",
    riskReason: "First contact overdue",
    probability: STAGE_PROBABILITY.NEW_ENQUIRY,
    conversationStarted: false,
    createdAt: minutesAgo(37),
    updatedAt: minutesAgo(37),
  },
  {
    firstName: "Priya",
    lastName: "Shah",
    email: `priya.shah${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900103",
    loanPurpose: "refinance",
    loanAmount: 310_000,
    propertyLocation: "Birmingham",
    timeframe: "30_days",
    source: "google_lp",
    attributionChannel: "Google Ads",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "refinance_midlands",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "NEW",
    caseStage: "CONTACT_DUE",
    operationalQueue: "AT_RISK",
    nextAction: "Urgent — no contact in 24h",
    nextActionAt: hoursAgo(2),
    callbackDueAt: hoursAgo(26),
    riskLevel: "HIGH",
    riskReason: "First contact overdue",
    probability: STAGE_PROBABILITY.CONTACT_DUE,
    conversationStarted: false,
    createdAt: daysAgo(1.2),
    updatedAt: hoursAgo(3),
  },
  {
    firstName: "Emma",
    lastName: "Laurent",
    email: `emma.laurent${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900104",
    loanPurpose: "development",
    loanAmount: 1_250_000,
    propertyLocation: "Bristol",
    timeframe: "60_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "CONTACTED",
    operationalQueue: "AWAITING_CALLBACK",
    nextAction: "Book priority call on thank-you page",
    nextActionAt: hoursFromNow(1),
    callbackDueAt: hoursFromNow(1),
    riskLevel: "MEDIUM",
    riskReason: "Qualification incomplete",
    probability: STAGE_PROBABILITY.CONTACTED,
    conversationStarted: true,
    firstResponseAt: hoursAgo(3),
    responseTimeMinutes: 11,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(3),
  },
  {
    firstName: "Marcus",
    lastName: "Webb",
    email: `marcus.webb${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900105",
    loanPurpose: "chain_break",
    loanAmount: 520_000,
    propertyLocation: "Leeds",
    timeframe: "14_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "BOOKED",
    caseStage: "CONSULTATION_BOOKED",
    operationalQueue: "AWAITING_CALLBACK",
    nextAction: "Complete consultation",
    nextActionAt: hoursFromNow(2),
    callbackDueAt: null,
    riskLevel: "LOW",
    riskReason: "Progressing well",
    probability: STAGE_PROBABILITY.CONSULTATION_BOOKED,
    conversationStarted: true,
    firstResponseAt: hoursAgo(8),
    responseTimeMinutes: 9,
    priorityCallSlot: "Today 14:30",
    priorityCallBookedAt: hoursAgo(2),
    additionalInfo: `${PRIORITY_CALL_BOOKED_PREFIX} Today 14:30] ${DEMO_TAG}`,
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(2),
  },
  {
    firstName: "David",
    lastName: "Chen",
    email: `david.chen${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900106",
    loanPurpose: "auction",
    loanAmount: 275_000,
    propertyLocation: "Liverpool",
    timeframe: "7_days",
    source: "referral",
    attributionChannel: "Referral",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "DOCUMENTS_REQUESTED",
    operationalQueue: "AWAITING_DOCUMENTS",
    nextAction: "Wait for borrower documents",
    nextActionAt: hoursFromNow(20),
    riskLevel: "MEDIUM",
    riskReason: "Documents due soon",
    probability: STAGE_PROBABILITY.DOCUMENTS_REQUESTED,
    conversationStarted: true,
    firstResponseAt: daysAgo(2),
    responseTimeMinutes: 14,
    consultationCompletedAt: daysAgo(1.5),
    documentsRequestedAt: hoursAgo(28),
    uploadToken: "demo-upload-token-david-chen",
    withDocuments: "partial",
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(6),
  },
  {
    firstName: "Lisa",
    lastName: "Nguyen",
    email: `lisa.nguyen${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900107",
    loanPurpose: "purchase",
    loanAmount: 640_000,
    propertyLocation: "Cambridge",
    timeframe: "30_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "DOCUMENTS_REQUESTED",
    operationalQueue: "AT_RISK",
    nextAction: "Chase documents",
    nextActionAt: hoursAgo(1),
    riskLevel: "HIGH",
    riskReason: "Documents overdue",
    probability: STAGE_PROBABILITY.DOCUMENTS_REQUESTED,
    conversationStarted: true,
    firstResponseAt: daysAgo(4),
    responseTimeMinutes: 18,
    consultationCompletedAt: daysAgo(3),
    documentsRequestedAt: hoursAgo(52),
    uploadToken: "demo-upload-token-lisa-nguyen",
    withDocuments: "partial",
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(2),
  },
  {
    firstName: "Fiona",
    lastName: "Walsh",
    email: `fiona.walsh${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900108",
    loanPurpose: "refinance",
    loanAmount: 480_000,
    propertyLocation: "Edinburgh",
    timeframe: "60_days",
    source: "organic",
    attributionChannel: "Organic",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "DOCUMENTS_RECEIVED",
    operationalQueue: "APPLICATION",
    nextAction: "Review documents",
    nextActionAt: hoursFromNow(2),
    riskLevel: "LOW",
    riskReason: "Documents received",
    probability: STAGE_PROBABILITY.DOCUMENTS_RECEIVED,
    conversationStarted: true,
    firstResponseAt: daysAgo(6),
    responseTimeMinutes: 12,
    consultationCompletedAt: daysAgo(5),
    documentsRequestedAt: daysAgo(4),
    withDocuments: "full",
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(4),
  },
  {
    firstName: "Robert",
    lastName: "Singh",
    email: `robert.singh${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900109",
    loanPurpose: "development",
    loanAmount: 2_100_000,
    propertyLocation: "London E14",
    timeframe: "90_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "APPLICATION_SUBMITTED",
    operationalQueue: "APPLICATION",
    nextAction: "Follow up lender",
    nextActionAt: hoursFromNow(36),
    riskLevel: "LOW",
    riskReason: "Progressing well",
    probability: STAGE_PROBABILITY.APPLICATION_SUBMITTED,
    conversationStarted: true,
    firstResponseAt: daysAgo(12),
    responseTimeMinutes: 8,
    consultationCompletedAt: daysAgo(10),
    documentsRequestedAt: daysAgo(9),
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1),
  },
  {
    firstName: "Helena",
    lastName: "Brooks",
    email: `helena.brooks${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900110",
    loanPurpose: "purchase",
    loanAmount: 750_000,
    propertyLocation: "Oxford",
    timeframe: "30_days",
    source: "google_lp",
    attributionChannel: "Google Ads",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "OFFER_RECEIVED",
    operationalQueue: "COMPLETION",
    nextAction: "Confirm completion timeline",
    nextActionAt: hoursFromNow(6),
    riskLevel: "LOW",
    riskReason: "Progressing well",
    probability: STAGE_PROBABILITY.OFFER_RECEIVED,
    conversationStarted: true,
    firstResponseAt: daysAgo(20),
    responseTimeMinutes: 10,
    consultationCompletedAt: daysAgo(18),
    documentsRequestedAt: daysAgo(16),
    createdAt: daysAgo(22),
    updatedAt: hoursAgo(8),
  },
  {
    firstName: "Tom",
    lastName: "Bradley",
    email: `tom.bradley${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900111",
    loanPurpose: "chain_break",
    loanAmount: 395_000,
    propertyLocation: "Nottingham",
    timeframe: "14_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: true,
    qualificationTier: "fully_qualified",
    status: "CONTACTED",
    caseStage: "COMPLETION_SCHEDULED",
    operationalQueue: "COMPLETION",
    nextAction: "Monitor completion",
    nextActionAt: daysAgo(-5),
    riskLevel: "LOW",
    riskReason: "Progressing well",
    probability: STAGE_PROBABILITY.COMPLETION_SCHEDULED,
    conversationStarted: true,
    firstResponseAt: daysAgo(28),
    responseTimeMinutes: 7,
    consultationCompletedAt: daysAgo(25),
    documentsRequestedAt: daysAgo(22),
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(12),
  },
  {
    firstName: "Michael",
    lastName: "Torres",
    email: `michael.torres${DEMO_EMAIL_DOMAIN}`,
    phone: "07700900112",
    loanPurpose: "purchase",
    loanAmount: 180_000,
    propertyLocation: "Cardiff",
    timeframe: "30_days",
    source: "facebook_lp",
    attributionChannel: "Meta",
    formCompleted: false,
    qualificationTier: "partial",
    status: "NEW",
    caseStage: "NEW_ENQUIRY",
    operationalQueue: "NEW_LEAD",
    nextAction: "Call borrower",
    nextActionAt: minutesAgo(-5),
    callbackDueAt: minutesAgo(-5),
    riskLevel: "MEDIUM",
    riskReason: "Awaiting first contact",
    probability: STAGE_PROBABILITY.NEW_ENQUIRY,
    conversationStarted: false,
    additionalInfo: `${DEMO_TAG} [Partial] Contact captured at step 2`,
    createdAt: minutesAgo(12),
    updatedAt: minutesAgo(12),
  },
];

export async function isDemoLead(lead: Pick<Lead, "email">) {
  return lead.email.endsWith(DEMO_EMAIL_DOMAIN);
}

export async function hasDemoData() {
  const leads = await db.lead.findMany();
  if (isNeuronourish()) {
    return leads.some(
      (l) =>
        l.email.endsWith("@demo.neuronourish.local") ||
        l.email.endsWith(DEMO_EMAIL_DOMAIN) ||
        (l.additionalInfo ?? "").includes("[DEMO]"),
    );
  }
  return leads.some((l) => l.email.endsWith(DEMO_EMAIL_DOMAIN));
}

export async function isCrmEmpty() {
  return (await db.lead.count()) === 0;
}

export async function clearDemoData() {
  if (isNeuronourish()) {
    await clearNeuronourishDemoData();
    return;
  }
  const leads = await db.lead.findMany();
  for (const lead of leads) {
    if (lead.email.endsWith(DEMO_EMAIL_DOMAIN)) {
      await db.lead.delete({ where: { id: lead.id } });
    }
  }
}

export async function seedDemoData(options?: { force?: boolean }) {
  if (isNeuronourish()) {
    return seedNeuronourishDemoData(options);
  }

  if (options?.force) {
    await clearDemoData();
  } else if (await hasDemoData()) {
    return { seeded: 0, skipped: true, message: "Demo data already loaded" };
  }

  let seeded = 0;

  for (const spec of DEMO_CASES) {
    const commission = computeExpectedCommission(spec.loanAmount);
    const expectedValue = computeExpectedValue(spec.loanAmount, spec.probability);

    const lead = await db.lead.create({
      data: {
        ...BASE,
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        phone: spec.phone,
        loanPurpose: spec.loanPurpose,
        loanAmount: spec.loanAmount,
        propertyValue: Math.max(spec.loanAmount * 1.4, 200_000),
        propertyLocation: spec.propertyLocation,
        timeframe: spec.timeframe,
        source: spec.source,
        attributionChannel: spec.attributionChannel,
        utmSource: spec.utmSource ?? null,
        utmMedium: spec.utmMedium ?? null,
        utmCampaign: spec.utmCampaign ?? null,
        fbclid: spec.fbclid ?? null,
        formCompleted: spec.formCompleted,
        qualificationTier: spec.qualificationTier ?? "unscreened",
        status: spec.status,
        caseStage: spec.caseStage,
        operationalQueue: spec.operationalQueue,
        nextAction: spec.nextAction,
        nextActionAt: spec.nextActionAt,
        callbackDueAt: spec.callbackDueAt ?? null,
        riskLevel: spec.riskLevel,
        riskReason: spec.riskReason,
        probability: spec.probability,
        estimatedCommission: commission,
        expectedValue,
        conversationStarted: spec.conversationStarted,
        firstResponseAt: spec.firstResponseAt ?? null,
        responseTimeMinutes: spec.responseTimeMinutes ?? null,
        priorityCallSlot: spec.priorityCallSlot ?? null,
        priorityCallBookedAt: spec.priorityCallBookedAt ?? null,
        consultationCompletedAt: spec.consultationCompletedAt ?? null,
        documentsRequestedAt: spec.documentsRequestedAt ?? null,
        uploadToken: spec.uploadToken ?? null,
        additionalInfo: spec.additionalInfo ? `${DEMO_TAG} ${spec.additionalInfo}` : DEMO_TAG,
      },
    });

    await db.lead.update({
      where: { id: lead.id },
      data: {
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "LEAD_CREATED",
        description: `${spec.firstName} ${spec.lastName} — demo case (${spec.caseStage.replace(/_/g, " ").toLowerCase()}).`,
      },
    });

    if (spec.conversationStarted) {
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "CALL_CONNECTED",
          description: `Daniel spoke to ${spec.firstName}.`,
        },
      });
    }

    if (spec.withDocuments) {
      const required = BRIDGING_DOCUMENT_TEMPLATE.filter((d) => d.required);
      for (let i = 0; i < required.length; i++) {
        const doc = required[i]!;
        const uploaded =
          spec.withDocuments === "full" ||
          (spec.withDocuments === "partial" && i < 2);
        await db.caseDocument.create({
          data: {
            leadId: lead.id,
            docKey: doc.docKey,
            label: doc.label,
            required: doc.required,
            status: uploaded ? "UPLOADED" : "REQUIRED",
          },
        });
      }
    }

    if (spec.caseStage === "DOCUMENTS_REQUESTED" || spec.caseStage === "DOCUMENTS_RECEIVED") {
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "DOCUMENT_REQUESTED",
          description: `Documents requested from ${spec.firstName}.`,
        },
      });
    }

    await db.note.create({
      data: {
        leadId: lead.id,
        content: `Demo case for ${spec.propertyLocation} — ${spec.loanPurpose.replace(/_/g, " ")}.`,
        author: "Daniel",
      },
    });

    seeded++;
  }

  return { seeded, skipped: false, message: `Loaded ${seeded} demo cases` };
}
