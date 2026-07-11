import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestCaseDocuments, BRIDGING_DOCUMENT_TEMPLATE } from "@/lib/case-documents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  let selectedDocs = [...BRIDGING_DOCUMENT_TEMPLATE];
  try {
    const body = await request.json();
    if (Array.isArray(body.docKeys) && body.docKeys.length > 0) {
      selectedDocs = BRIDGING_DOCUMENT_TEMPLATE.filter((d) =>
        body.docKeys.includes(d.docKey),
      );
    }
  } catch {
    // use default checklist
  }

  const result = await requestCaseDocuments(lead, selectedDocs);
  const updated = await db.lead.findUnique({
    where: { id },
    include: { caseDocuments: true },
  });

  return NextResponse.json({ ok: true, ...result, case: updated });
}
