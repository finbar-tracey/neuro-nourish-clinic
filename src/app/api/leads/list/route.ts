import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const leads = await db.lead.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
  });

  const store = await import("@/lib/crm-persistence").then((m) => m.readCrmStore());
  const openTaskCounts = await db.task.groupBy({
    by: ["leadId"],
    where: { completed: false },
    _count: { id: true },
  });

  const openTasksByLead = Object.fromEntries(
    openTaskCounts.map((row) => [row.leadId, row._count.id]),
  );

  const enriched = leads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    loanAmount: lead.loanAmount,
    loanPurpose: lead.loanPurpose,
    source: lead.source,
    status: lead.status,
    formCompleted: lead.formCompleted,
    qualificationTier: lead.qualificationTier,
    nurtureEnrolled: lead.nurtureEnrolled,
    utmCampaign: lead.utmCampaign,
    createdAt: lead.createdAt,
    lastContactedAt: lead.lastContactedAt,
    _count: {
      notes: store.notes.filter((note) => note.leadId === lead.id).length,
      tasks: store.tasks.filter((task) => task.leadId === lead.id).length,
      activities: store.activities.filter((activity) => activity.leadId === lead.id).length,
    },
    openTasks: openTasksByLead[lead.id] ?? 0,
  }));

  return NextResponse.json(enriched);
}
