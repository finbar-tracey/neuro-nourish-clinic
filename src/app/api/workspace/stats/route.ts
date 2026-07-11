import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PIPELINE_COLUMNS } from "@/lib/lead-pipeline";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const [
    total,
    automations,
    fullyQualified,
    partialQualified,
    ...statusCounts
  ] = await Promise.all([
    db.lead.count(),
    db.automationRule.count({ where: { enabled: true } }),
    db.lead.count({
      where: { status: "NEW", qualificationTier: "fully_qualified" },
    }),
    db.lead.count({
      where: {
        status: "NEW",
        OR: [{ qualificationTier: "partial" }, { formCompleted: false }],
      },
    }),
    ...PIPELINE_COLUMNS.map((col) =>
      db.lead.count({ where: { status: col.id } }),
    ),
  ]);

  const byStatus = PIPELINE_COLUMNS.reduce(
    (acc, col, i) => {
      acc[col.id] = statusCounts[i];
      return acc;
    },
    {} as Record<string, number>,
  );

  const recentActivity = await db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      lead: { select: { firstName: true, lastName: true } },
    },
  });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [leadsThisWeek, won, lost, disqualified, openTasks] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { status: "WON" } }),
    db.lead.count({ where: { status: "LOST" } }),
    db.lead.count({ where: { status: "DISQUALIFIED" } }),
    db.task.count({ where: { completed: false } }),
  ]);

  const closed = won + lost + disqualified;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : null;

  return NextResponse.json({
    stats: {
      total,
      automations,
      fullyQualified,
      partialQualified,
      byStatus,
      newLeads: byStatus.NEW ?? 0,
      wonLeads: byStatus.WON ?? 0,
      followUpLeads: byStatus.FOLLOW_UP ?? 0,
      leadsThisWeek,
      winRate,
      openTasks,
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
    },
    recentActivity,
  });
}
