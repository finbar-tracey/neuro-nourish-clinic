import fs from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

import { runtimeSecret } from "@/lib/runtime-env";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|heic|doc|docx)$/i;

export function isAllowedUpload(file: {
  type: string;
  size: number;
  name?: string;
}): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB)`;
  }
  if (file.name && ALLOWED_EXT.test(file.name)) {
    return null;
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return "File type not allowed. Use PDF, Word, or image files.";
  }
  if (!file.type && file.name && !ALLOWED_EXT.test(file.name)) {
    return "File type not allowed. Use PDF, Word, or image files.";
  }
  return null;
}

function blobConfigured() {
  return Boolean(runtimeSecret("BLOB_READ_WRITE_TOKEN"));
}

export async function storeCaseDocument(
  leadId: string,
  docKey: string,
  fileName: string,
  buffer: Buffer,
): Promise<{ storageKey: string; fileUrl: string | null }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `${leadId}/${docKey}-${safeName}`;

  if (blobConfigured()) {
    const blob = await put(`case-documents/${storageKey}`, buffer, {
      access: "public",
      addRandomSuffix: false,
    });
    return { storageKey, fileUrl: blob.url };
  }

  const dir = path.join(process.cwd(), ".case-uploads", leadId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${docKey}-${safeName}`);
  await fs.writeFile(filePath, buffer);
  return { storageKey, fileUrl: null };
}

export function localCaseDocumentPath(
  leadId: string,
  docKey: string,
  fileName: string,
): string {
  return path.join(process.cwd(), ".case-uploads", leadId, `${docKey}-${fileName}`);
}

export function contentTypeForFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "image/jpeg";
}

export async function readLocalCaseDocument(
  leadId: string,
  docKey: string,
  fileName: string,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(localCaseDocumentPath(leadId, docKey, fileName));
  } catch {
    return null;
  }
}
