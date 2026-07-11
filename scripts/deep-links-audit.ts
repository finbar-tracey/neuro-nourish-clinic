#!/usr/bin/env npx tsx
/**
 * Borrower deep-link audit — book, resume, upload, and production smoke.
 * Run: npm run deep-links:audit
 * Live: DEEP_LINKS_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run deep-links:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildJourneyEmail,
  SAMPLE_EMAIL_CONTEXT,
} from "../src/lib/journey-emails";
import {
  borrowerBookUrl,
  borrowerLandingUrl,
  borrowerResumeUrl,
  borrowerUploadUrl,
  normalizeLeadId,
  normalizeUploadToken,
} from "../src/lib/sms-links";
import { uploadPageUrl } from "../src/lib/case-documents";
import {
  captureSmsBody,
  noBookingFollowUpSmsBody,
  qualifiedConfirmationSmsBody,
} from "../src/lib/sms-copy";
import { validateCtaHref } from "../src/lib/email-cta";

const PRODUCTION = "https://loans.bridgingloansbroker.co.uk";
const SAMPLE_LEAD_ID = "a1b2c3d4e5f6789012345678";
const SAMPLE_TOKEN = "a".repeat(48);

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

function read(rel: string): string {
  return readFileSync(join(import.meta.dirname, "..", rel), "utf8");
}

function usesProduction(href: string) {
  return href.startsWith(PRODUCTION);
}

// ── URL builders always use production ──
assert("borrowerBookUrl production", usesProduction(borrowerBookUrl(SAMPLE_LEAD_ID)));
assert("borrowerResumeUrl production", usesProduction(borrowerResumeUrl(SAMPLE_LEAD_ID)));
assert("borrowerLandingUrl production", borrowerLandingUrl() === `${PRODUCTION}/lp`);
assert("borrowerUploadUrl production", usesProduction(borrowerUploadUrl(SAMPLE_TOKEN)));
assert("uploadPageUrl production", usesProduction(uploadPageUrl(SAMPLE_TOKEN)));

// ── Lead / token normalization ──
assert(
  "normalizeLeadId strips punctuation",
  normalizeLeadId("a1b2c3d4e5f6789012345678.") === SAMPLE_LEAD_ID,
);
assert("normalizeLeadId rejects ellipsis", normalizeLeadId("…") === null);
assert(
  "normalizeUploadToken accepts 48-char hex",
  normalizeUploadToken(SAMPLE_TOKEN) === SAMPLE_TOKEN,
);
assert("normalizeUploadToken rejects short token", normalizeUploadToken("abc") === null);

// ── SMS deep links ──
const sampleLead = {
  id: SAMPLE_LEAD_ID,
  firstName: "Test",
  loanAmount: 250_000,
} as Parameters<typeof captureSmsBody>[0];

for (const [name, body] of [
  ["capture SMS", captureSmsBody(sampleLead)],
  ["qualified SMS", qualifiedConfirmationSmsBody(sampleLead)],
  ["no-booking SMS", noBookingFollowUpSmsBody(sampleLead)],
] as const) {
  assert(`${name} uses production host`, body.includes("loans.bridgingloansbroker.co.uk"), body);
  assert(`${name} no localhost`, !body.includes("localhost"), body);
}

// ── Email CTAs with empty SITE_URL (simulates misconfigured env) ──
const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
const prevVercel = process.env.VERCEL_URL;
process.env.NEXT_PUBLIC_SITE_URL = "";
process.env.VERCEL_URL = "";

const nurture = buildJourneyEmail("nurture-day-30", SAMPLE_EMAIL_CONTEXT);
const qualified = buildJourneyEmail("qualified-confirmation", {
  ...SAMPLE_EMAIL_CONTEXT,
  leadId: SAMPLE_LEAD_ID,
});
const capture = buildJourneyEmail("capture-welcome", {
  ...SAMPLE_EMAIL_CONTEXT,
  leadId: SAMPLE_LEAD_ID,
});
const docReq = buildJourneyEmail("document-request", {
  ...SAMPLE_EMAIL_CONTEXT,
  uploadLink: borrowerUploadUrl(SAMPLE_TOKEN),
});

process.env.NEXT_PUBLIC_SITE_URL = prevSite;
process.env.VERCEL_URL = prevVercel;

for (const [label, href, expectation] of [
  ["nurture-day-30", nurture.options?.cta?.href ?? "", "lp"],
  ["qualified-confirmation", qualified.options?.cta?.href ?? "", "book"],
  ["capture-welcome", capture.options?.cta?.href ?? "", "resume"],
  ["document-request", docReq.options?.cta?.href ?? "", "upload"],
] as const) {
  const result = validateCtaHref(href, expectation);
  assert(`${label} CTA valid with empty SITE_URL`, result.ok, result.reason ?? href);
  assert(`${label} CTA production host`, usesProduction(href), href);
}

// ── Page / client wiring ──
const bookClient = read("src/components/landing/book-page-client.tsx");
const form = read("src/components/forms/facebook-lead-form.tsx");
assert("Book page uses normalizeLeadId", bookClient.includes("normalizeLeadId"));
assert("Book page fetches session API", bookClient.includes("/session"));
assert("Form uses normalizeLeadId for ?lead=", form.includes("normalizeLeadId"));
assert("Form resumes qualified leads on ?lead=&step=3", form.includes("data.formCompleted"));
assert("Upload API uses normalizeUploadToken", read("src/app/api/upload/[token]/route.ts").includes("normalizeUploadToken"));
assert("Session API uses normalizeLeadId", read("src/app/api/leads/[id]/session/route.ts").includes("normalizeLeadId"));

// ── Forbidden broken routes ──
for (const rel of [
  "src/lib/journey-emails.ts",
  "src/lib/sms-copy.ts",
  "src/lib/sms-links.ts",
]) {
  const content = read(rel);
  assert(`${rel} has no /lp/thank-you`, !content.includes("/lp/thank-you"));
  assert(`${rel} has no http:///` , !/https?:\/\/\//.test(content));
}

async function liveSmoke() {
  const base =
    process.env.DEEP_LINKS_BASE_URL?.replace(/\/$/, "") ??
    process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "");
  if (!base) return;

  const pages = ["/lp", "/lp/book", "/privacy"];
  for (const path of pages) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15_000) });
      assert(`Live ${path} responds`, res.ok, String(res.status));
    } catch (error) {
      assert(
        `Live ${path} responds`,
        false,
        error instanceof Error ? error.message : "fetch failed",
      );
    }
  }

  try {
    const badLead = await fetch(`${base}/api/leads/not-a-valid-lead-id/session`, {
      signal: AbortSignal.timeout(15_000),
    });
    assert("Invalid lead session returns 400", badLead.status === 400, String(badLead.status));
  } catch (error) {
    assert(
      "Invalid lead session returns 400",
      false,
      error instanceof Error ? error.message : "fetch failed",
    );
  }

  try {
    const missing = await fetch(`${base}/api/leads/${SAMPLE_LEAD_ID}/session`, {
      signal: AbortSignal.timeout(15_000),
    });
    assert(
      "Unknown lead session returns 404 (not 500)",
      missing.status === 404,
      String(missing.status),
    );
  } catch (error) {
    assert(
      "Unknown lead session returns 404",
      false,
      error instanceof Error ? error.message : "fetch failed",
    );
  }

  try {
    const badUpload = await fetch(`${base}/api/upload/invalid-token`, {
      signal: AbortSignal.timeout(15_000),
    });
    assert("Invalid upload token returns 400", badUpload.status === 400, String(badUpload.status));
  } catch (error) {
    assert(
      "Invalid upload token returns 400",
      false,
      error instanceof Error ? error.message : "fetch failed",
    );
  }

  try {
    const known = await fetch(`${base}/api/leads/dd321354114f37f4f81a712c/session`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (known.ok) {
      const data = (await known.json()) as { formCompleted?: boolean };
      assert("Known test lead has formCompleted", data.formCompleted === true);
    }
  } catch {
    /* optional — test lead may be removed */
  }
}

async function main() {
  await liveSmoke();

  const passed = checks.filter((c) => c.pass).length;
  console.log("\n🔗 Borrower deep-link audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

void main();
