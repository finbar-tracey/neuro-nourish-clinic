import { NextResponse } from "next/server";
import { AutomationTrigger } from "@/generated/prisma/client";
import { runAutomations, seedDefaultAutomations, ensureCaptureAutomationRules } from "@/lib/automations";
import { sendBrokerNewLeadAlert, sendBrokerMetaQualifiedTierAlert } from "@/lib/broker-notifications";
import { sendCaptureSms, sendCaptureJourneyEmails } from "@/lib/capture-notifications";
import { sendQualifiedConfirmation } from "@/lib/complete-notifications";
import { verifyCompletionToken } from "@/lib/completion-link";
import { captureCaseDefaults, humanTimelineForCapture } from "@/lib/case-capture";
import { logCaseTimeline } from "@/lib/case-engine";
import { db } from "@/lib/db";
import { cancelMetaCompleteChaseTasks } from "@/lib/meta-complete-chase";
import { enrollLongTimeframeNurture } from "@/lib/nurture-sequence";
import {
  checkLeadQualification,
  checkLongTimeframeQualification,
} from "@/lib/qualifications";
import { isLongTimeframe } from "@/lib/timeframes";
import { resolveAttributionChannel } from "@/lib/attribution";
import {
  captureOperationalFields,
  metaHotOperationalFields,
  metaWarmOperationalFields,
  qualifiedOperationalFields,
} from "@/lib/operational-queue";
import { isMetaInstantFormSource } from "@/lib/meta-source";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { emailConfigured } from "@/lib/email";
import { smsConfigured } from "@/lib/sms";
import { sendMetaCapiEvent, type MetaCapiInput } from "@/lib/meta-capi";
import { contactCaptureSchema, leadFormSchema } from "@/lib/validations";
import { autoPauseWinbackForEmail } from "@/lib/winback-auto-pause";
import { handleFunnelPost } from "@/lib/neuronourish-lead-submit";

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

function withAdAngleInfo(info: string | null | undefined, adAngle?: string): string | null {
  if (!adAngle) return info ?? null;
  const tag = `[Ad angle: ${adAngle}]`;
  if (info?.includes(tag)) return info;
  return info ? `${tag} ${info}` : tag;
}

async function requireMetaCompletionToken(
  leadId: string | undefined,
  completionToken: string | undefined,
  source: string | undefined,
): Promise<NextResponse | null> {
  if (!leadId) return null;

  const existing = await db.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const needsToken =
    isMetaInstantFormSource(existing.source) ||
    isMetaInstantFormSource(source) ||
    Boolean(completionToken);

  if (!needsToken) return null;

  if (!completionToken || !verifyCompletionToken(leadId, completionToken)) {
    return NextResponse.json({ error: "Invalid or expired completion link" }, { status: 403 });
  }

  return null;
}

function metaQualifiedOperationalFields(timeframe: string, now = new Date()) {
  if (timeframe === "urgent") return metaHotOperationalFields(now);
  return metaWarmOperationalFields(now);
}

function capturePayload(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    loanPurpose: string;
    loanAmount: number;
    timeframe: string;
  },
  tracking: TrackingInput,
) {
  const angleNote = tracking.adAngle ? `[Ad angle: ${tracking.adAngle}] ` : "";
  return {
    ...data,
    termMonths: 12,
    propertyType: "pending",
    propertyValue: Math.max(data.loanAmount, 50_000),
    propertyLocation: "Not yet provided",
    hasExistingMortgage: false,
    willOccupy: false,
    hasEverOccupied: false,
    formCompleted: false,
    qualificationTier: "partial",
    status: "NEW" as const,
    ...leadTrackingFields({ ...tracking, source: tracking.source ?? "landing_page" }),
    additionalInfo: `${angleNote}[Partial] Contact captured at step 2 — qualification pending`,
    attributionChannel: resolveAttributionChannel({
      source: tracking.source ?? "landing_page",
      utmSource: tracking.utmSource,
      utmMedium: tracking.utmMedium,
      fbclid: tracking.fbclid,
      gclid: tracking.gclid,
    }),
    ...captureOperationalFields(),
    ...captureCaseDefaults(),
  };
}

async function saveOrUpdateLead(
  leadId: string | undefined,
  payload: ReturnType<typeof capturePayload>,
) {
  if (leadId) {
    const existing = await db.lead.findUnique({ where: { id: leadId } });
    if (existing) {
      if (existing.formCompleted) {
        return db.lead.update({
          where: { id: leadId },
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            loanPurpose: payload.loanPurpose,
            loanAmount: payload.loanAmount,
            timeframe: payload.timeframe,
            source: payload.source,
            utmSource: payload.utmSource,
            utmMedium: payload.utmMedium,
            utmCampaign: payload.utmCampaign,
            fbclid: payload.fbclid,
          },
        });
      }
      return db.lead.update({ where: { id: leadId }, data: payload });
    }
  }
  return db.lead.create({ data: payload });
}


export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = await rateLimit(`leads:${ip}`, 15, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    await seedDefaultAutomations();
    await ensureCaptureAutomationRules();

    const body = await request.json();

    if (body?.vertical === "neuronourish") {
      return handleFunnelPost(request, body);
    }

    if (body.stage === "capture") {
      const parsed = contactCaptureSchema.safeParse(body);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const key = issue.path[0]?.toString() ?? "form";
          errors[key] = issue.message;
        });
        return NextResponse.json({ errors }, { status: 400 });
      }

      const {
        stage: _,
        leadId,
        consent: __,
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
        ...contact
      } = parsed.data;

      const tracking = {
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

      const lead = await saveOrUpdateLead(
        leadId,
        capturePayload(contact, tracking),
      );

      const isNewCapture = !leadId;
      if (isNewCapture) {
        await logCaseTimeline(
          lead.id,
          "FORM_SUBMITTED",
          humanTimelineForCapture(lead),
          "Borrower",
          { utmSource, utmCampaign, fbclid },
        );
        await logCaseTimeline(lead.id, "LEAD_CREATED", "Case created and assigned to Daniel.", "System");

        const captureSms = await sendCaptureSms(lead);
        await sendCaptureJourneyEmails(lead);
        void captureSms;
        void sendMetaCapiEvent("InitiateCheckout", {
          ...metaCapiContext(request, tracking, lead),
          contentName: "Bridging Quote Step 2 — Contact Captured",
          eventId: metaEventId ?? `checkout-${lead.id}`,
        });
      } else {
        await db.activity.create({
          data: {
            leadId: lead.id,
            type: "FORM_SUBMITTED",
            description: "Contact details updated — form still incomplete",
          },
        });
      }

      void autoPauseWinbackForEmail(lead.email, "new_form", lead.id);
      return NextResponse.json({ captured: true, id: lead.id }, { status: 201 });
    }

    const parsed = leadFormSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? "form";
        errors[key] = issue.message;
      });
      return NextResponse.json({ errors }, { status: 400 });
    }

    const {
      stage: _stage,
      leadId,
      consent: _consent,
      completionToken,
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
      ...data
    } = parsed.data;

    const tokenError = await requireMetaCompletionToken(leadId, completionToken, source);
    if (tokenError) return tokenError;

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
    const trackingFields = leadTrackingFields(tracking);
    const longTimeframe = isLongTimeframe(data.timeframe);

    if (longTimeframe) {
      const minLoanCheck = checkLeadQualification({
        loanAmount: data.loanAmount,
        willOccupy: false,
        hasEverOccupied: false,
      });

      if (!minLoanCheck.qualified) {
        const lead = leadId
          ? await db.lead.update({
              where: { id: leadId },
              data: {
                ...data,
                ...trackingFields,
                formCompleted: true,
                qualificationTier: "out_of_scope",
                status: "DISQUALIFIED",
                source: source ?? "landing_page",
                additionalInfo: withAdAngleInfo(
                  `[Disqualified: ${minLoanCheck.code}] ${minLoanCheck.title}`,
                  adAngle,
                ),
              },
            })
          : await db.lead.create({
              data: {
                ...data,
                ...trackingFields,
                formCompleted: true,
                qualificationTier: "out_of_scope",
                status: "DISQUALIFIED",
                source: source ?? "landing_page",
                additionalInfo: withAdAngleInfo(
                  `[Disqualified: ${minLoanCheck.code}] ${minLoanCheck.title}`,
                  adAngle,
                ),
              },
            });

        await db.activity.create({
          data: {
            leadId: lead.id,
            type: "FORM_SUBMITTED",
            description: `Disqualified lead — ${minLoanCheck.code}`,
          },
        });

        if (isMetaInstantFormSource(lead.source)) {
          await cancelMetaCompleteChaseTasks(lead.id);
        }

        return NextResponse.json(
          {
            disqualified: true,
            qualified: false,
            code: minLoanCheck.code,
            title: minLoanCheck.title,
            message: minLoanCheck.message,
          },
          { status: 422 },
        );
      }

      const nurtureResult = checkLongTimeframeQualification(data.timeframe);
      const lead = leadId
        ? await db.lead.update({
            where: { id: leadId },
            data: {
              ...data,
              ...trackingFields,
              formCompleted: true,
              qualificationTier: "out_of_scope",
              status: "FOLLOW_UP",
              nurtureEnrolled: true,
              source: source ?? "landing_page",
              additionalInfo: withAdAngleInfo(
                `[Nurture: long_timeframe] Timeline over 3 months — email sequence enrolled`,
                adAngle,
              ),
            },
          })
        : await db.lead.create({
            data: {
              ...data,
              ...trackingFields,
              formCompleted: true,
              qualificationTier: "out_of_scope",
              status: "FOLLOW_UP",
              nurtureEnrolled: true,
              source: source ?? "landing_page",
              additionalInfo: withAdAngleInfo(
                `[Nurture: long_timeframe] Timeline over 3 months — email sequence enrolled`,
                adAngle,
              ),
            },
          });

      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "FORM_SUBMITTED",
          description: "Long-timeframe lead — nurture sequence enrolled",
          metadata: JSON.stringify({ utmSource, utmCampaign, fbclid }),
        },
      });

      await enrollLongTimeframeNurture(lead);
      await cancelMetaCompleteChaseTasks(lead.id);

      return NextResponse.json(
        {
          nurtureEnrolled: true,
          disqualified: true,
          qualified: false,
          code: nurtureResult.code,
          title: nurtureResult.title,
          message: nurtureResult.message,
        },
        { status: 422 },
      );
    }

    const qualification = checkLeadQualification({
      loanAmount: data.loanAmount,
      willOccupy: data.willOccupy,
      hasEverOccupied: data.hasEverOccupied,
    });

    if (!qualification.qualified) {
      const lead = leadId
        ? await db.lead.update({
            where: { id: leadId },
            data: {
              ...data,
              ...trackingFields,
              formCompleted: true,
              qualificationTier: "out_of_scope",
              status: "DISQUALIFIED",
              caseStage: "DISQUALIFIED",
              remindersPaused: true,
              operationalQueue: "NEW_LEAD",
              source: source ?? "landing_page",
              additionalInfo: withAdAngleInfo(
                `[Disqualified: ${qualification.code}] ${qualification.title}`,
                adAngle,
              ),
            },
          })
        : await db.lead.create({
            data: {
              ...data,
              ...trackingFields,
              formCompleted: true,
              qualificationTier: "out_of_scope",
              status: "DISQUALIFIED",
              caseStage: "DISQUALIFIED",
              remindersPaused: true,
              operationalQueue: "NEW_LEAD",
              source: source ?? "landing_page",
              additionalInfo: withAdAngleInfo(
                `[Disqualified: ${qualification.code}] ${qualification.title}`,
                adAngle,
              ),
            },
          });

      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "FORM_SUBMITTED",
          description: `Disqualified lead — ${qualification.code}`,
          metadata: JSON.stringify({ utmSource, utmCampaign, fbclid }),
        },
      });

      if (isMetaInstantFormSource(lead.source)) {
        await cancelMetaCompleteChaseTasks(lead.id);
      }

      return NextResponse.json(
        {
          disqualified: true,
          qualified: false,
          code: qualification.code,
          title: qualification.title,
          message: qualification.message,
        },
        { status: 422 },
      );
    }

    let metaSource = isMetaInstantFormSource(source);
    if (!metaSource && leadId) {
      const existingForSource = await db.lead.findUnique({
        where: { id: leadId },
        select: { source: true, formCompleted: true },
      });
      metaSource = isMetaInstantFormSource(existingForSource?.source);
    }

    const operationalFields = metaSource
      ? metaQualifiedOperationalFields(data.timeframe)
      : qualifiedOperationalFields();

    const resolvedSource = metaSource
      ? "meta_instant_form"
      : (source ?? "landing_page");

    const lead = leadId
      ? await db.lead.update({
          where: { id: leadId },
          data: {
            ...data,
            ...trackingFields,
            formCompleted: true,
            qualificationTier: "fully_qualified",
            status: "NEW",
            source: resolvedSource,
            additionalInfo: withAdAngleInfo(null, adAngle),
            ...operationalFields,
          },
        })
      : await db.lead.create({
          data: {
            ...data,
            ...trackingFields,
            formCompleted: true,
            qualificationTier: "fully_qualified",
            status: "NEW",
            source: resolvedSource,
            additionalInfo: withAdAngleInfo(null, adAngle),
            ...operationalFields,
          },
        });

    if (metaSource) {
      await cancelMetaCompleteChaseTasks(lead.id);
    }

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "FORM_SUBMITTED",
        description: `${lead.firstName} ${lead.lastName} completed enquiry via ${lead.source}`,
        metadata: JSON.stringify({ utmSource, utmCampaign, fbclid }),
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "LEAD_CREATED",
        description: "Qualified lead — form completed",
      },
    });

    await runAutomations(AutomationTrigger.LEAD_CREATED, lead);
    await sendQualifiedConfirmation(lead);
    if (isMetaInstantFormSource(lead.source)) {
      await sendBrokerMetaQualifiedTierAlert(lead);
    } else {
      void sendBrokerNewLeadAlert(lead);
    }
    void sendMetaCapiEvent(
      isMetaInstantFormSource(lead.source) ? "CompleteRegistration" : "Lead",
      {
        ...metaCapiContext(request, tracking, lead),
        contentName: isMetaInstantFormSource(lead.source)
          ? "Meta Instant Form — Qualified"
          : "Bridging Loan Quote",
        eventId: metaEventId ?? `lead-${lead.id}`,
      },
    );

    void autoPauseWinbackForEmail(lead.email, "new_form", lead.id);
    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 },
    );
  }
}
