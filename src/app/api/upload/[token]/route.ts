import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentsForCase,
  getLeadByUploadToken,
  markDocumentUploaded,
} from "@/lib/case-documents";
import { isAllowedUpload } from "@/lib/document-storage";
import { normalizeUploadToken } from "@/lib/sms-links";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = normalizeUploadToken(rawToken);
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  const lead = await getLeadByUploadToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const documents = await getDocumentsForCase(lead.id);
  return NextResponse.json({
    borrowerName: lead.firstName,
    documents,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = clientIp(request);
  const limited = await rateLimit(`upload:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { token: rawToken } = await params;
  const token = normalizeUploadToken(rawToken);
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  const lead = await getLeadByUploadToken(token);
  if (!lead) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const form = await request.formData();
  const docKey = form.get("docKey")?.toString();
  const file = form.get("file");
  if (!docKey || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const validationError = isAllowedUpload(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await markDocumentUploaded(lead.id, docKey, file.name, buffer);

  return NextResponse.json({ ok: true });
}
