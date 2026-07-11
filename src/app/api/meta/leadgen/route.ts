import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { logCaseTimeline } from "@/lib/case-engine";
import {
  humanTimelineForMetaCapture,
  metaPartialAdditionalInfo,
  metaPartialCaseDefaults,
} from "@/lib/case-capture";
import { sendMetaIngestNotifications } from "@/lib/meta-capture-notifications";
import {
  fetchMetaLeadgen,
  mapMetaLeadFields,
  metaWebhookVerifyToken,
  verifyMetaWebhookSignature,
} from "@/lib/meta-leadgen";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { META_INSTANT_FORM_SOURCE, metaInstantFormEnabled } from "@/lib/meta-source";
import { runtimeSecret } from "@/lib/runtime-env";
import { isBridging } from "@/lib/vertical-config";

type LeadgenChange = {
  field?: string;
  value?: { leadgen_id?: string };
};

type LeadgenWebhookBody = {
  object?: string;
  entry?: { changes?: LeadgenChange[] }[];
};

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const expected = metaWebhookVerifyToken();
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function ingestLeadgenId(leadgenId: string) {
  const existing = await db.lead.findUnique({ where: { metaLeadgenId: leadgenId } });
  if (existing) {
    return { lead: existing, duplicate: true as const };
  }

  const payload = await fetchMetaLeadgen(leadgenId);
  if (!payload?.field_data) {
    return { error: "fetch_failed" as const };
  }

  const mapped = mapMetaLeadFields(payload.field_data);
  if (!mapped.email || !mapped.phone) {
    return { error: "missing_contact" as const };
  }

  const lead = await db.lead.create({
    data: {
      ...mapped,
      metaLeadgenId: leadgenId,
      termMonths: 12,
      propertyType: "pending",
      propertyValue: Math.max(mapped.loanAmount, 50_000),
      propertyLocation: "Not yet provided",
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
      formCompleted: false,
      qualificationTier: "partial",
      status: "NEW",
      source: META_INSTANT_FORM_SOURCE,
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: "instant-v1",
      attributionChannel: "Meta",
      landingPageUrl: "/lp/complete",
      additionalInfo: metaPartialAdditionalInfo(leadgenId),
      ...metaPartialCaseDefaults(),
    },
  });

  await logCaseTimeline(
    lead.id,
    "FORM_SUBMITTED",
    humanTimelineForMetaCapture(lead),
    "System",
    { leadgenId },
  );
  await logCaseTimeline(lead.id, "LEAD_CREATED", "Meta instant form partial — awaiting step 3.", "System");

  const notifications = await sendMetaIngestNotifications(lead);

  void sendMetaCapiEvent("Lead", {
    email: lead.email,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    leadId: lead.id,
    loanAmount: lead.loanAmount,
    currency: "GBP",
    contentName: "Meta Instant Form — Partial",
    eventId: `meta-leadgen-${leadgenId}`,
  });

  return { lead, duplicate: false as const, notifications };
}

export async function POST(request: NextRequest) {
  if (!isBridging() || !metaInstantFormEnabled()) {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (runtimeSecret("META_APP_SECRET") && !verifyMetaWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: LeadgenWebhookBody;
  try {
    body = JSON.parse(rawBody) as LeadgenWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadgenIds: string[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "leadgen" && change.value?.leadgen_id) {
        leadgenIds.push(change.value.leadgen_id);
      }
    }
  }

  const results = [];
  for (const leadgenId of leadgenIds) {
    results.push({ leadgenId, ...(await ingestLeadgenId(leadgenId)) });
  }

  return NextResponse.json({ ok: true, results });
}
