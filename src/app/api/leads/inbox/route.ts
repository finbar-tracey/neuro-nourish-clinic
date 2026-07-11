import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeOperationalLead } from "@/lib/operational-queue";
import { computeInboxMetrics } from "@/lib/speed-to-lead";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  const openTaskCounts = await db.task.groupBy({
    by: ["leadId"],
    where: { completed: false },
    _count: { id: true },
  });
  const openTasksByLead = Object.fromEntries(
    openTaskCounts.map((row) => [row.leadId, row._count.id]),
  );

  const normalizedLeads = leads.map((lead) => normalizeOperationalLead(lead));

  const enriched = normalizedLeads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    loanAmount: lead.loanAmount,
    loanPurpose: lead.loanPurpose,
    source: lead.source,
    attributionChannel: lead.attributionChannel,
    status: lead.status,
    owner: lead.owner,
    operationalQueue: lead.operationalQueue,
    nextAction: lead.nextAction,
    nextActionAt: lead.nextActionAt,
    callbackDueAt: lead.callbackDueAt,
    priorityCallSlot: lead.priorityCallSlot,
    firstResponseAt: lead.firstResponseAt,
    responseTimeMinutes: lead.responseTimeMinutes,
    conversationStarted: lead.conversationStarted,
    estimatedCommission: lead.estimatedCommission,
    formCompleted: lead.formCompleted,
    qualificationTier: lead.qualificationTier,
    createdAt: lead.createdAt,
    openTasks: openTasksByLead[lead.id] ?? 0,
  }));

  const metrics = computeInboxMetrics(normalizedLeads);

  return NextResponse.json({ leads: enriched, metrics });
}
