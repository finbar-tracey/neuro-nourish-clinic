#!/usr/bin/env npx tsx
/**
 * Validates CTA hrefs on every journey email template.
 * Run: npm run email:cta-audit
 */
import {
  buildJourneyEmail,
  JOURNEY_EMAIL_IDS,
  SAMPLE_EMAIL_CONTEXT,
  type EmailContext,
  type JourneyEmailId,
} from "../src/lib/journey-emails";
import { JOURNEY_CTA_RULES, validateCtaHref } from "../src/lib/email-cta";
import { getSiteUrl } from "../src/lib/site-url";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

function auditEmail(id: JourneyEmailId, ctx: EmailContext, label: string) {
  const email = buildJourneyEmail(id, ctx);
  const rule = JOURNEY_CTA_RULES[id];
  const cta = email.options?.cta;

  if (rule?.required) {
    assert(
      `${label}: ${id} has CTA`,
      Boolean(cta?.href && cta.label),
      cta?.href,
    );
    if (cta?.href) {
      const result = validateCtaHref(cta.href, rule.expectation);
      assert(
        `${label}: ${id} CTA valid (${rule.expectation})`,
        result.ok,
        result.reason ?? cta.href,
      );
    }
  } else if (cta?.href) {
    const result = validateCtaHref(cta.href, "absolute");
    assert(`${label}: ${id} optional CTA absolute`, result.ok, result.reason ?? cta.href);
  }

  const body = email.body;
  assert(
    `${label}: ${id} body has no /lp/thank-you`,
    !body.includes("/lp/thank-you"),
  );
  assert(
    `${label}: ${id} body has no malformed http:/// links`,
    !/https?:\/\/\//.test(body),
  );
}

// Full context — all CTAs that should exist in production
for (const id of JOURNEY_EMAIL_IDS) {
  auditEmail(id, SAMPLE_EMAIL_CONTEXT, "sample");
}

// Qualified confirmation must work with real lead id pattern
const qualified = buildJourneyEmail("qualified-confirmation", {
  ...SAMPLE_EMAIL_CONTEXT,
  leadId: "abc123def456",
});
assert(
  "qualified-confirmation CTA includes lead id",
  qualified.options?.cta?.href?.includes("abc123def456") === true,
  qualified.options?.cta?.href,
);

// Booking reminder fallback when no Teams (book page)
const reminderNoTeams = buildJourneyEmail("booking-reminder", {
  ...SAMPLE_EMAIL_CONTEXT,
  teamsLink: null,
  leadId: "abc123def456",
});
const reminderCta = reminderNoTeams.options?.cta;
assert(
  "booking-reminder fallback CTA is book page",
  reminderCta?.href?.includes("/lp/book?lead=abc123def456") === true,
  reminderCta?.href,
);

// Site URL must never produce empty host when env is blank
const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
const prevVercel = process.env.VERCEL_URL;
process.env.NEXT_PUBLIC_SITE_URL = "";
process.env.VERCEL_URL = "";
const withEmptyEnv = buildJourneyEmail("qualified-confirmation", {
  ...SAMPLE_EMAIL_CONTEXT,
  leadId: "lead-empty-env",
});
process.env.NEXT_PUBLIC_SITE_URL = prevSite;
process.env.VERCEL_URL = prevVercel;

const emptyEnvHref = withEmptyEnv.options?.cta?.href ?? "";
assert(
  "qualified CTA absolute when SITE_URL empty",
  validateCtaHref(emptyEnvHref, "book").ok,
  emptyEnvHref || getSiteUrl(),
);

const passed = checks.filter((c) => c.pass).length;
console.log("\n📧 Journey email CTA audit\n");
for (const c of checks) {
  console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);
process.exit(passed === checks.length ? 0 : 1);
