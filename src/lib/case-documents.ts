import crypto from "node:crypto";

import type { Lead } from "@/generated/prisma/client";
import { transitionCaseStage, logCaseTimeline } from "@/lib/case-engine";
import { BRIDGING_DOCUMENT_TEMPLATE, type DocumentItem } from "@/lib/document-checklist";
import { storeCaseDocument } from "@/lib/document-storage";
import { db } from "@/lib/db";
import { borrowerUploadUrl } from "@/lib/sms-links";
import { sendJourneyEmail } from "@/lib/journey-email-send";
import { brokerDocumentsCompleteSmsBody, documentChase24hSmsBody, documentChase48hSmsBody, documentRequestSmsBody } from "@/lib/sms-copy";
import { brokerNotifyPhone } from "@/lib/broker-notify";
import { sendSms } from "@/lib/sms";

export { BRIDGING_DOCUMENT_TEMPLATE } from "@/lib/document-checklist";
export type { DocumentItem } from "@/lib/document-checklist";

const UPLOAD_TOKEN_TTL_DAYS = 30;

export function uploadPageUrl(token: string) {
  return borrowerUploadUrl(token);
}

function newUploadToken() {
  return crypto.randomBytes(24).toString("hex");
}

function uploadTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + UPLOAD_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isUploadTokenValid(lead: Lead, now = new Date()): boolean {
  if (!lead.uploadToken) return false;
  if (!lead.uploadTokenExpiresAt) return true;
  return lead.uploadTokenExpiresAt > now;
}

export async function requestCaseDocuments(
  lead: Lead,
  selectedDocs: DocumentItem[] = [...BRIDGING_DOCUMENT_TEMPLATE],
) {
  const token = lead.uploadToken ?? newUploadToken();
  const expiresAt = uploadTokenExpiry();
  const uploadLink = uploadPageUrl(token);
  const now = new Date();

  const existing = await db.caseDocument.findMany({ where: { leadId: lead.id } });
  if (existing.length === 0) {
    for (const doc of selectedDocs) {
      await db.caseDocument.create({
        data: {
          leadId: lead.id,
          docKey: doc.docKey,
          label: doc.label,
          required: doc.required,
          status: "REQUIRED",
        },
      });
    }
  }

  const checklist = selectedDocs
    .filter((d) => d.required)
    .map((d) => `□ ${d.label}`)
    .join("\n");

  const smsBody = documentRequestSmsBody(lead, uploadLink);

  const [email, sms] = await Promise.all([
    sendJourneyEmail(
      lead,
      "document-request",
      { uploadLink, docChecklist: checklist },
      { skipDedup: true },
    ),
    sendSms(lead.phone, smsBody, {
      audience: "borrower",
      leadId: lead.id,
      purpose: "document-request",
    }),
  ]);

  await transitionCaseStage(
    lead,
    "DOCUMENTS_REQUESTED",
    `Documents were requested from ${lead.firstName}.`,
    {
      uploadToken: token,
      uploadTokenExpiresAt: expiresAt,
      documentsRequestedAt: now,
      remindersPaused: false,
    },
  );

  await logCaseTimeline(
    lead.id,
    "DOCUMENT_REQUESTED",
    `Document upload link sent to ${lead.firstName}.`,
    "Daniel",
    { emailSent: email.sent, smsSent: sms.sent },
  );

  return { uploadLink, token, emailSent: email.sent, smsSent: sms.sent };
}

export async function getDocumentsForCase(leadId: string) {
  return db.caseDocument.findMany({ where: { leadId } });
}

export async function markDocumentUploaded(
  leadId: string,
  docKey: string,
  fileName: string,
  fileBuffer: Buffer,
) {
  const docs = await db.caseDocument.findMany({ where: { leadId } });
  const doc = docs.find((d) => d.docKey === docKey);
  if (!doc) throw new Error("Document not found");

  const { storageKey, fileUrl } = await storeCaseDocument(leadId, docKey, fileName, fileBuffer);
  const safeName = storageKey.split("/").pop() ?? fileName;

  await db.caseDocument.update({
    where: { id: doc.id },
    data: {
      status: "UPLOADED",
      fileName: safeName,
      fileUrl,
      uploadedAt: new Date(),
    },
  });

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  await logCaseTimeline(
    leadId,
    "DOCUMENT_UPLOADED",
    `${doc.label} was uploaded.`,
    "Borrower",
    { docKey, fileName: safeName, fileUrl },
  );

  const all = await db.caseDocument.findMany({ where: { leadId } });
  const required = all.filter((d) => d.required);
  const allUploaded = required.every((d) => d.status === "UPLOADED" || d.status === "ACCEPTED");

  if (allUploaded) {
    await transitionCaseStage(
      lead,
      "DOCUMENTS_RECEIVED",
      `All required documents received for ${lead.firstName}.`,
    );
    await sendSms(
      brokerNotifyPhone(),
      brokerDocumentsCompleteSmsBody(lead.firstName, lead.lastName),
      { audience: "broker", leadId: lead.id, purpose: "documents-complete" },
    );
  }
}

export async function getLeadByUploadToken(token: string) {
  const leads = await db.lead.findMany();
  const lead = leads.find((l) => l.uploadToken === token) ?? null;
  if (!lead) return null;
  if (!isUploadTokenValid(lead)) return null;
  return lead;
}
