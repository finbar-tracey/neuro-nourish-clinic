import { NextResponse } from "next/server";
import { z } from "zod";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { isValidPhone, normalizePhone, phoneValidationError } from "@/lib/phone-ie";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import {
  enrollClinicianBriefingFollowup,
  enrollEnterpriseBriefingNurture,
  sendBriefingPackDeliveryEmail,
  sendEmployerWellnessAutoResponse,
} from "@/lib/neuronourish-nurture";
import {
  clinicianBriefingPayloadFromLead,
  sendClinicianBriefingAlert,
  sendNeuronourishPartnerAlert,
} from "@/lib/neuronourish-notifications";
import { resolveCampaignSource, type TrackingParams } from "@/lib/tracking";
import { resolveAttributionChannel } from "@/lib/attribution";
import { captureCaseDefaults } from "@/lib/case-capture";
import { qualifiedOperationalFields } from "@/lib/operational-queue";
import { defaultCaseOwner, partnerDisplayName } from "@/lib/vertical-config";
import { nnLegacyLoanStub } from "@/lib/neuronourish-workspace";
import { AutomationTrigger } from "@/generated/prisma/client";
import { runAutomations } from "@/lib/automations";

const briefingPackSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z
    .string()
    .min(1)
    .superRefine((value, ctx) => {
      if (!isValidPhone(value)) {
        ctx.addIssue({
          code: "custom",
          message: phoneValidationError(value) ?? "Enter a valid Irish or UK mobile number",
        });
      }
    })
    .transform((value) => normalizePhone(value)),
  clinicName: z.string().optional(),
  companyName: z.string().optional(),
  segment: z.enum(["clinician", "employer"]).optional(),
  consent: z.literal(true),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  landingPageUrl: z.string().optional(),
  referrer: z.string().optional(),
});

/** Clinician or employer briefing pack — starts B2B cold follow-up sequence. */
export async function POST(request: Request) {
  const parsed = briefingPackSchema.safeParse(await request.json());
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const data = parsed.data;
  const phone = data.phone;
  const tracking = data as TrackingParams;
  const isEmployer = data.segment === "employer";
  const source =
    resolveCampaignSource(tracking, isEmployer ? "employer_wellness" : "clinics_briefing_pack") ??
    (isEmployer ? "employer_wellness" : "clinics_briefing_pack");

  const existing = (await db.lead.findMany()).find(
    (l) => l.email.toLowerCase() === data.email.toLowerCase(),
  );

  const patch = isEmployer
    ? nnOperationalPatchForStage("eoi_submitted")
    : nnOperationalPatchForStage("clinician_briefing_downloaded");

  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone,
    ...nnLegacyLoanStub(isEmployer ? "employer_oh" : "healthcare_partnership"),
    hasExistingMortgage: false,
    willOccupy: false,
    hasEverOccupied: false,
    formCompleted: true,
    primaryConcern: isEmployer ? "employer_oh" : "healthcare_partnership",
    segment: isEmployer ? "employer" : "clinician",
    qualificationTier: "highly_qualified",
    additionalInfo: isEmployer
      ? `[NeuroNourish] Enterprise briefing pack downloaded${data.companyName ? ` · ${data.companyName}` : ""}`
      : `[NeuroNourish] Clinical briefing pack downloaded${data.clinicName ? ` · ${data.clinicName}` : ""}`,
    status: "NEW" as const,
    source,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmContent: data.utmContent,
    utmTerm: data.utmTerm,
    landingPageUrl: data.landingPageUrl,
    referrer: data.referrer,
    attributionChannel: resolveAttributionChannel({
      source,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
    }),
    ...qualifiedOperationalFields(),
    ...captureCaseDefaults(),
    owner: defaultCaseOwner(),
    ...patch,
  };

  let lead;
  if (existing) {
    lead = await db.lead.update({ where: { id: existing.id }, data: payload });
  } else {
    lead = await db.lead.create({ data: payload });
    await logCaseTimeline(
      lead.id,
      "LEAD_CREATED",
      `Case created — assigned to ${partnerDisplayName()}.`,
      "System",
    );
    await runAutomations(AutomationTrigger.LEAD_CREATED, lead);
  }

  await logCaseTimeline(
    lead.id,
    "FORM_SUBMITTED",
    isEmployer ? "Enterprise briefing pack downloaded" : "Clinical briefing pack downloaded",
    "Borrower",
  );

  if (isEmployer) {
    void sendEmployerWellnessAutoResponse(lead);
    void enrollEnterpriseBriefingNurture(lead.id);
    void sendNeuronourishPartnerAlert(lead);
  } else {
    void sendBriefingPackDeliveryEmail(lead);
    void enrollClinicianBriefingFollowup(lead);
    void sendClinicianBriefingAlert(
      clinicianBriefingPayloadFromLead(lead, {
        clinicName: data.clinicName,
      }),
    );
  }

  return NextResponse.json({ ok: true, leadId: lead.id });
}
