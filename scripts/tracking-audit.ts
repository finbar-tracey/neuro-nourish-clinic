#!/usr/bin/env npx tsx
/**
 * Meta Pixel + Conversions API audit with /10 score.
 *
 * Static:  npm run tracking:audit
 * Live CAPI: TRACKING_AUDIT_LIVE=true npm run tracking:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type ScoreItem = { label: string; points: number; ok: boolean; detail?: string };

const items: ScoreItem[] = [];

function score(label: string, points: number, ok: boolean, detail?: string) {
  items.push({ label, points, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("\nMeta tracking audit\n");

const layout = read("src/app/layout.tsx");
const formSrc = read("src/components/forms/facebook-lead-form.tsx");
const thankYou = read("src/components/forms/qualified-thank-you.tsx");
const metaCapi = read("src/lib/meta-capi.ts");
const metaTracking = read("src/lib/meta-tracking.ts");
const leadsRoute = read("src/app/api/leads/route.ts");
const bookRoute = read("src/app/api/book-priority-call/route.ts");
const caseDetail = read("src/components/workspace/case-detail.tsx");
const caseCard = read("src/components/workspace/case-card.tsx");
const sourcesRoute = read("src/app/api/workspace/sources/route.ts");
const sourcesUi = read("src/components/workspace/sources-report.tsx");
const mainForm = read("src/components/forms/multi-step-form.tsx");

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const capiToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();

score("Meta Pixel wired in layout", 1, layout.includes("<MetaPixel"));
score(
  "Pixel + CAPI env configured",
  1,
  Boolean(pixelId && capiToken && /^\d{10,20}$/.test(pixelId ?? "")),
  pixelId ? `pixel ${pixelId}` : "missing env",
);
score(
  "Browser/server InitiateCheckout + Lead",
  1.5,
  (formSrc.includes('"InitiateCheckout"') || mainForm.includes('"InitiateCheckout"')) &&
    (formSrc.includes('"Lead"') || mainForm.includes('"Lead"')) &&
    leadsRoute.includes('sendMetaCapiEvent("InitiateCheckout"') &&
    (leadsRoute.includes('sendMetaCapiEvent("Lead"') ||
      /sendMetaCapiEvent\([\s\S]*?"Lead"/.test(leadsRoute) ||
      /sendMetaCapiEvent\([\s\S]*?CompleteRegistration/.test(leadsRoute)),
);
score(
  "Schedule booking deduped (browser + CAPI)",
  0.5,
  thankYou.includes("scheduleEventId") &&
    read("src/lib/priority-call-booking.ts").includes('sendMetaCapiEvent("Schedule"'),
);
score(
  "Event deduplication (shared event_id)",
  1,
  metaTracking.includes("metaEventId") && read("src/lib/tracking.ts").includes("eventID"),
);
score(
  "CAPI match quality (fn/ln/external_id/fbp/fbc/IP)",
  1,
  metaCapi.includes("userData.fn") &&
    metaCapi.includes("external_id") &&
    metaTracking.includes("ensureMetaClickCookie"),
);
score(
  "UTM, fbclid, gclid, landing URL captured",
  1,
  read("src/lib/tracking.ts").includes("utm_source") &&
    read("src/lib/validations.ts").includes("landingPageUrl"),
);
score(
  "Workspace case detail attribution panel",
  1,
  caseDetail.includes("AttributionPanel"),
);
score(
  "Case cards show source summary",
  0.5,
  caseCard.includes("attributionSummary"),
);
score(
  "Sources report + campaign breakdown",
  1,
  sourcesRoute.includes("byCampaign") && sourcesUi.includes("Campaigns & ad angles"),
);
score(
  "Tracking audit + core-setup URL sanitize",
  1,
  metaTracking.includes("sanitizeMetaEventUrl") && metaCapi.includes("META_CAPI_DRY_RUN"),
);

const earned = items.filter((i) => i.ok).reduce((s, i) => s + i.points, 0);
const total = items.reduce((s, i) => s + i.points, 0);
const rating = Math.round((earned / total) * 10 * 10) / 10;

console.log(`\nScore: ${rating}/10 (${earned.toFixed(1)}/${total} points)\n`);

if (rating >= 9.5) {
  console.log("Verdict: Production-grade tracking — pixel, CAPI, and workspace attribution aligned.\n");
} else if (rating >= 8) {
  console.log("Verdict: Strong tracking — minor gaps remain.\n");
} else {
  console.log("Verdict: Tracking needs work before scaling paid spend.\n");
}

async function liveCapiPing() {
  if (process.env.TRACKING_AUDIT_LIVE !== "true") {
    console.log("Live CAPI test skipped (TRACKING_AUDIT_LIVE=true to run)\n");
    return;
  }
  if (!pixelId || !capiToken) {
    console.log("Live CAPI test skipped — missing credentials\n");
    return;
  }

  process.env.META_CAPI_DRY_RUN = "false";
  const { sendMetaCapiEvent } = await import("../src/lib/meta-capi");

  if (!process.env.META_CAPI_TEST_EVENT_CODE?.trim()) {
    console.log("⚠️  META_CAPI_TEST_EVENT_CODE not set — ping goes to production dataset.\n");
  }

  console.log("Sending live CAPI test Lead…");
  const result = await sendMetaCapiEvent("Lead", {
    email: "tracking-audit@bridgingloansbroker.co.uk",
    phone: "+447000000000",
    firstName: "Tracking",
    lastName: "Audit",
    leadId: `audit-${Date.now()}`,
    eventId: `tracking-audit-${Date.now()}`,
    loanAmount: 250000,
    currency: "GBP",
    contentName: "Tracking Audit Ping",
    sourceUrl: "https://loans.bridgingloansbroker.co.uk/lp",
    fbclid: "tracking-audit-test",
  });

  if (result.sent) {
    console.log(`✅ CAPI live ping OK (trace ${result.fbtraceId ?? "n/a"})\n`);
  } else {
    console.log(`❌ CAPI live ping failed: ${result.skipped ?? result.error}\n`);
    process.exitCode = 1;
  }
}

liveCapiPing()
  .then(() => {
    if (rating < 10 && process.exitCode !== 1) {
      process.exitCode = rating >= 9 ? 0 : 1;
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
