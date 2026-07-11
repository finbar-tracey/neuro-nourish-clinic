import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { seedDefaultAutomations } from "@/lib/automations";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  await seedDefaultAutomations();

  const rules = await db.automationRule.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { runs: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const body = await request.json();

  const rule = await db.automationRule.create({
    data: {
      name: body.name,
      description: body.description,
      trigger: body.trigger,
      action: body.action,
      config: JSON.stringify(body.config ?? {}),
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const body = await request.json();

  const rule = await db.automationRule.update({
    where: { id: body.id },
    data: {
      enabled: body.enabled,
      name: body.name,
      description: body.description,
    },
  });

  return NextResponse.json(rule);
}
