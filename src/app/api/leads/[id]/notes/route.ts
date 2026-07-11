import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const { content, author } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const note = await db.note.create({
    data: {
      leadId: id,
      content: content.trim(),
      author: author ?? "Team",
    },
  });

  await db.activity.create({
    data: {
      leadId: id,
      type: "NOTE_ADDED",
      description: `Note added by ${note.author}`,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
