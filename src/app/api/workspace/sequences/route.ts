import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeSequenceFunnelStats } from "@/lib/sequence-funnel-stats";

/** Read-only sequence funnel stats for the visual automations viewer. */
export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const [leads, tasks] = await Promise.all([
    db.lead.findMany(),
    db.task.findMany({ where: { completed: false } }),
  ]);

  const { flows, overview } = computeSequenceFunnelStats(leads, tasks);
  const updatedAt = new Date().toISOString();

  return NextResponse.json({ flows, overview, updatedAt });
}
