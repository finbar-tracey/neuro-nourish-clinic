import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { contentTypeForFileName, readLocalCaseDocument } from "@/lib/document-storage";
import { db } from "@/lib/db";

/** Workspace-authenticated download for case documents (blob redirect or local file). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id: leadId, docId } = await params;
  const docs = await db.caseDocument.findMany({ where: { leadId } });
  const doc = docs.find((d) => d.id === docId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.fileUrl) {
    return NextResponse.redirect(doc.fileUrl);
  }

  if (!doc.fileName || (doc.status !== "UPLOADED" && doc.status !== "ACCEPTED")) {
    return NextResponse.json({ error: "File not uploaded" }, { status: 404 });
  }

  const buffer = await readLocalCaseDocument(leadId, doc.docKey, doc.fileName);
  if (!buffer) {
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }

  const contentType = contentTypeForFileName(doc.fileName);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
