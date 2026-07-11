import { NextResponse } from "next/server";
import { AutomationTrigger } from "@/generated/prisma/client";
import { runAutomations, seedDefaultAutomations, ensureCaptureAutomationRules } from "@/lib/automations";
import { captureCaseDefaults } from "@/lib/case-capture";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { resolveAttributionChannel } from "@/lib/attribution";
import { qualifiedOperationalFields } from "@/lib/operational-queue";
import { sendMetaCapiEvent, type MetaCapiInput } from "@/lib/meta-capi";
import { clientIp } from "@/lib/rate-limit";
import { emailConfigured } from "@/lib/email";
import { smsConfigured } from "@/lib/sms";
import {
  sendHealthcarePartnerAlert,
  sendHealthcareQualifiedConfirmation,
} from "@/lib/healthcare-notifications";
import {
  checkHealthcareQualification,
  treatmentLabel,
  timelineLabel,
} from "@/lib/healthcare-qualifications";
import {
  BUDGET_BAND_VALUES,
} from "@/lib/healthcare-lp-copy";
import { defaultCaseOwner, partnerDisplayName } from "@/lib/vertical-config";
import { healthcareLeadSchema } from "@/lib/validations";
import { autoPauseWinbackForEmail } from "@/lib/winback-auto-pause";

type TrackingInput = {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  landingPageUrl?: string;
  referrer?: string;
  deviceType?: string;
  adAngle?: string;
  metaEventId?: string;
  fbp?: string;
  fbc?: string;
};

function leadTrackingFields(tracking: TrackingInput) {
  return {
    source: tracking.source,
    utmSource: tracking.utmSource,
    utmMedium: tracking.utmMedium,
    utmCampaign: tracking.utmCampaign,
    utmContent: tracking.utmContent,
    utmTerm: tracking.utmTerm,
    fbclid: tracking.fbclid,
    gclid: tracking.gclid,
    landingPageUrl: tracking.landingPageUrl,
    referrer: tracking.referrer,
    deviceType: tracking.deviceType,
  };
}

function metaCapiContext(
  request: Request,
  tracking: TrackingInput,
  lead: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    loanAmount: number;
    fbclid?: string | null;
  },
): MetaCapiInput {
  return {
    email: lead.email,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    leadId: lead.id,
    loanAmount: lead.loanAmount,
    currency: "GBP",
    sourceUrl: tracking.landingPageUrl,
    fbclid: tracking.fbclid ?? lead.fbclid ?? undefined,
    eventId: tracking.metaEventId,
    fbp: tracking.fbp,
    fbc: tracking.fbc,
    clientIp: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function handleHealthcareLeadPost(
  request: Request,
  body: unknown,
): Promise<NextResponse> {
  await seedDefaultAutomations();
  await ensureCaptureAutomationRules();

  const parsed = healthcareLeadSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const {
    leadId,
    consent: _consent,
    treatmentType,
    timeline,
    postcode,
    budgetBand,
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    fbclid,
    gclid,
    landingPageUrl,
    referrer,
    deviceType,
    adAngle,
    metaEventId,
    fbp,
    fbc,
    firstName,
    lastName,
    email,
    phone,
  } = parsed.data;

  const tracking: TrackingInput = {
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    fbclid,
    gclid,
    landingPageUrl,
    referrer,
    deviceType,
    adAngle,
    metaEventId,
    fbp,
    fbc,
  };

  const qual = checkHealthcareQualification({ postcode, timeline });
  if (!qual.qualified) {
    return NextResponse.json(
      {
        disqualified: true,
        code: qual.code,
        title: qual.title,
        message: qual.message,
        nurtureEnrolled: qual.nurtureEnrolled ?? false,
      },
      { status: 200 },
    );
  }

  const loanAmount = BUDGET_BAND_VALUES[budgetBand] ?? 10_000;
  const metaJson = JSON.stringify({
    vertical: "healthcare",
    treatmentType,
    timeline,
    budgetBand,
    postcode,
  });

  const payload = {
    firstName,
    lastName,
    email,
    phone,
    loanPurpose: treatmentType,
    loanAmount,
    termMonths: 0,
    propertyType: "consultation",
    propertyValue: loanAmount,
    propertyLocation: postcode,
    timeframe: timeline,
    hasExistingMortgage: false,
    willOccupy: false,
    hasEverOccupied: false,
    formCompleted: true,
    qualificationTier: "qualified",
    status: "NEW" as const,
    ...leadTrackingFields({ ...tracking, source: tracking.source ?? "lp/implants" }),
    additionalInfo: `[Healthcare] ${treatmentLabel(treatmentType)} · ${timelineLabel(timeline)} · ${postcode} · ${metaJson}`,
    attributionChannel: resolveAttributionChannel({
      source: tracking.source ?? "lp/implants",
      utmSource,
      utmMedium,
      fbclid,
      gclid,
    }),
    ...qualifiedOperationalFields(),
    ...captureCaseDefaults(),
    owner: defaultCaseOwner(),
  };

  let lead;
  if (leadId) {
    const existing = await db.lead.findUnique({ where: { id: leadId } });
    if (existing) {
      lead = await db.lead.update({ where: { id: leadId }, data: payload });
    } else {
      lead = await db.lead.create({ data: payload });
    }
  } else {
    lead = await db.lead.create({ data: payload });
  }

  await logCaseTimeline(
    lead.id,
    "FORM_SUBMITTED",
    `${firstName} ${lastName} — implant consult enquiry (${treatmentLabel(treatmentType)})`,
    "Borrower",
    { utmSource, utmCampaign, fbclid },
  );
  await logCaseTimeline(
    lead.id,
    "LEAD_CREATED",
    `Case created — assigned to ${partnerDisplayName()}.`,
    "System",
  );

  const [brokerSms, qualifiedNotify] = await Promise.all([
    sendHealthcarePartnerAlert(lead),
    sendHealthcareQualifiedConfirmation(lead),
  ]);

  await runAutomations(AutomationTrigger.LEAD_CREATED, lead);
  void autoPauseWinbackForEmail(lead.email, "new_form", lead.id);

  void sendMetaCapiEvent("Lead", {
    ...metaCapiContext(request, tracking, lead),
    contentName: "Healthcare Implant Consult Lead",
    eventId: metaEventId ?? `lead-${lead.id}`,
  });

  const brokerParts: string[] = [];
  if (brokerSms.sent) brokerParts.push("SMS");
  if (emailConfigured()) brokerParts.push("email");

  await logCaseTimeline(
    lead.id,
    brokerSms.sent ? "SMS_SENT" : "AUTOMATION_RUN",
    `${partnerDisplayName()} notified — ${brokerParts.join(", ") || "pending"}.`,
    "System",
    { brokerSmsSent: brokerSms.sent, emailConfigured: emailConfigured(), smsConfigured: smsConfigured() },
  );

  void qualifiedNotify;

  return NextResponse.json(
    {
      id: lead.id,
      qualified: true,
      treatmentType,
      timeline,
      postcode,
    },
    { status: 201 },
  );
}
