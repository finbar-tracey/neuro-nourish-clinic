import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { commitSequenceImport } from "@/lib/sequence-csv-import/commit-import";
import { LAWFUL_BASES, type LawfulBasis } from "@/lib/sequence-csv-import/types";

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      previewId?: string;
      lawfulBasis?: LawfulBasis;
      attestationAccepted?: boolean;
    };

    if (!body.previewId) {
      return NextResponse.json({ error: "previewId is required" }, { status: 400 });
    }

    if (!body.lawfulBasis || !LAWFUL_BASES.includes(body.lawfulBasis)) {
      return NextResponse.json({ error: "Valid lawful basis is required" }, { status: 400 });
    }

    const { batch } = await commitSequenceImport({
      previewId: body.previewId,
      lawfulBasis: body.lawfulBasis,
      attestationAccepted: body.attestationAccepted === true,
    });

    return NextResponse.json({
      ok: true,
      batch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    const status = message.includes("re-preview") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
