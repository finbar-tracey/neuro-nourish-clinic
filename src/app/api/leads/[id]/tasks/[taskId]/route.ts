import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id, taskId } = await params;
  const body = await request.json();

  const task = await db.task.findFirst({
    where: { id: taskId, leadId: id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: { completed: body.completed ?? task.completed },
  });

  if (body.completed && !task.completed) {
    await db.activity.create({
      data: {
        leadId: id,
        type: "NOTE_ADDED",
        description: `Task completed: ${task.title}`,
      },
    });
  }

  return NextResponse.json(updated);
}
