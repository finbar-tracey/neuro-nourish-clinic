import { NextRequest, NextResponse } from "next/server";
import { leadToCase } from "@/lib/case";
import { inferCaseStage } from "@/lib/case-stages";
import { parseAdAngle } from "@/lib/attribution-display";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type Bucket = {
  leads: number;
  consultations: number;
  documentsRequested: number;
  applications: number;
  completed: number;
  expectedRevenue: number;
  revenueGenerated: number;
};

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const leads = await db.lead.findMany();
  const bySource = new Map<string, Bucket>();
  const byCampaign = new Map<string, Bucket & { campaign: string; channel: string }>();

  for (const lead of leads) {
    const source = lead.attributionChannel ?? lead.utmSource ?? lead.source ?? "Direct";
    const bucket = bySource.get(source) ?? {
      leads: 0,
      consultations: 0,
      documentsRequested: 0,
      applications: 0,
      completed: 0,
      expectedRevenue: 0,
      revenueGenerated: 0,
    };
    bucket.leads++;
    const stage = inferCaseStage(lead);
    if (
      stage === "CONSULTATION_BOOKED" ||
      stage === "CONSULTATION_COMPLETED" ||
      lead.priorityCallBookedAt
    ) {
      bucket.consultations++;
    }
    if (
      stage === "DOCUMENTS_REQUESTED" ||
      stage === "DOCUMENTS_RECEIVED" ||
      lead.documentsRequestedAt
    ) {
      bucket.documentsRequested++;
    }
    if (
      stage === "APPLICATION_PREPARING" ||
      stage === "APPLICATION_SUBMITTED" ||
      stage === "DOCUMENTS_RECEIVED"
    ) {
      bucket.applications++;
    }
    if (stage === "COMPLETED") {
      bucket.completed++;
      bucket.revenueGenerated += lead.revenueGenerated ?? lead.initialInvoiceAmount ?? 0;
    }
    bucket.expectedRevenue += leadToCase(lead).expectedValue;
    bySource.set(source, bucket);

    const campaign =
      lead.utmCampaign ??
      parseAdAngle(lead.additionalInfo)?.toUpperCase() ??
      null;
    if (campaign) {
      const key = `${source}::${campaign}`;
      const campaignBucket = byCampaign.get(key) ?? {
        campaign,
        channel: source,
        leads: 0,
        consultations: 0,
        documentsRequested: 0,
        applications: 0,
        completed: 0,
        expectedRevenue: 0,
        revenueGenerated: 0,
      };
      campaignBucket.leads++;
      if (
        stage === "CONSULTATION_BOOKED" ||
        stage === "CONSULTATION_COMPLETED" ||
        lead.priorityCallBookedAt
      ) {
        campaignBucket.consultations++;
      }
      if (
        stage === "DOCUMENTS_REQUESTED" ||
        stage === "DOCUMENTS_RECEIVED" ||
        lead.documentsRequestedAt
      ) {
        campaignBucket.documentsRequested++;
      }
      if (
        stage === "APPLICATION_PREPARING" ||
        stage === "APPLICATION_SUBMITTED" ||
        stage === "DOCUMENTS_RECEIVED"
      ) {
        campaignBucket.applications++;
      }
      if (stage === "COMPLETED") {
        campaignBucket.completed++;
        campaignBucket.revenueGenerated +=
          lead.revenueGenerated ?? lead.initialInvoiceAmount ?? 0;
      }
      campaignBucket.expectedRevenue += leadToCase(lead).expectedValue;
      byCampaign.set(key, campaignBucket);
    }
  }

  const rows = [...bySource.entries()]
    .map(([source, stats]) => ({
      source,
      ...stats,
      consultationRate:
        stats.leads > 0 ? Math.round((stats.consultations / stats.leads) * 100) : 0,
      completedRate:
        stats.leads > 0 ? Math.round((stats.completed / stats.leads) * 100) : 0,
      conversionRate:
        stats.leads > 0 ? Math.round((stats.consultations / stats.leads) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const campaigns = [...byCampaign.values()]
    .map((row) => ({
      ...row,
      consultationRate: row.leads > 0 ? Math.round((row.consultations / row.leads) * 100) : 0,
      completedRate: row.leads > 0 ? Math.round((row.completed / row.leads) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  return NextResponse.json({ rows, campaigns });
}
