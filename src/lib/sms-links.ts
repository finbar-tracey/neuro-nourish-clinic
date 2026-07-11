import { borrowerLinkOrigin } from "@/lib/site-url";

const LEAD_ID_RE = /^[a-f0-9]{24}$/i;

/** Normalize lead id from URL params (trim, decode, strip trailing punctuation). */
export function normalizeLeadId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let id = decodeURIComponent(raw.trim());
  id = id.replace(/[.,;)\]>]+$/g, "");
  return LEAD_ID_RE.test(id) ? id.toLowerCase() : null;
}

/** Book a priority call (qualified leads). */
export function borrowerBookUrl(leadId: string) {
  return `${borrowerLinkOrigin()}/lp/book?lead=${leadId}`;
}

/** Resume Step 3 eligibility check (partial leads). */
export function borrowerResumeUrl(leadId: string) {
  return `${borrowerLinkOrigin()}/lp?lead=${leadId}&step=3`;
}

/** Meta instant form — signed step 3 completion page. */
export function borrowerCompleteUrl(leadId: string, token: string) {
  const params = new URLSearchParams({ lead: leadId, token });
  return `${borrowerLinkOrigin()}/lp/complete?${params.toString()}`;
}

/** Main paid landing page. */
export function borrowerLandingUrl() {
  return `${borrowerLinkOrigin()}/lp`;
}

const UPLOAD_TOKEN_RE = /^[a-f0-9]{48}$/i;

/** Normalize upload token from URL (trim, decode, strip trailing punctuation). */
export function normalizeUploadToken(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let token = decodeURIComponent(raw.trim());
  token = token.replace(/[.,;)\]>]+$/g, "");
  return UPLOAD_TOKEN_RE.test(token) ? token.toLowerCase() : null;
}

/** Secure document upload page for a case. */
export function borrowerUploadUrl(token: string) {
  return `${borrowerLinkOrigin()}/upload/${token}`;
}

export const BROKER_DISPLAY_PHONE = "020 7177 4141";
