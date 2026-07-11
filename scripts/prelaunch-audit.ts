#!/usr/bin/env npx tsx
/**
 * Pre-launch web checklist (Baud Haus / WebDecodes / Verlua launch guidance).
 * Run: npm run prelaunch:audit
 * Live checks: PRELAUNCH_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run prelaunch:audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Check = { id: string; category: string; name: string; pass: boolean; detail?: string };

const checks: Check[] = [];
const root = join(import.meta.dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(join(root, rel));
}

function check(id: string, category: string, name: string, pass: boolean, detail?: string) {
  checks.push({ id, category, name, pass, detail });
}

function includesAll(haystack: string, needles: string[]) {
  return needles.every((n) => haystack.includes(n));
}

// ── 1. Environment & deployment (WebDecodes § Environment checks) ──

const gitignore = read(".gitignore");
check("ENV-1", "Environment", ".env files excluded from git", gitignore.includes(".env"));

const envExample = read(".env.example");
const requiredEnvKeys = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "WORKSPACE_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NOTIFICATIONS_DRY_RUN",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "BROKER_NOTIFY_EMAIL",
  "VONAGE_API_KEY",
  "VONAGE_API_SECRET",
  "VONAGE_FROM_NUMBER",
  "VONAGE_SENDER_ID",
  "BROKER_NOTIFY_PHONE",
  "BLOB_READ_WRITE_TOKEN",
  "MICROSOFT_TENANT_ID",
  "META_CAPI_ACCESS_TOKEN",
];
for (const key of requiredEnvKeys) {
  check("ENV-2", "Environment", `.env.example documents ${key}`, envExample.includes(key));
}

check("ENV-3", "Environment", "vercel-build script defined", read("package.json").includes('"vercel-build"'));

// ── 2. Security (Developer Resource § HTTPS & security headers) ──

const nextConfig = read("next.config.ts");
check(
  "SEC-1",
  "Security",
  "X-Content-Type-Options: nosniff",
  nextConfig.includes('"X-Content-Type-Options"') && nextConfig.includes("nosniff"),
);
check(
  "SEC-2",
  "Security",
  "Referrer-Policy configured",
  nextConfig.includes('"Referrer-Policy"'),
);
check(
  "SEC-3",
  "Security",
  "X-Frame-Options: DENY",
  nextConfig.includes('"X-Frame-Options"') && nextConfig.includes("DENY"),
);
check(
  "SEC-4",
  "Security",
  "Permissions-Policy restricts sensitive APIs",
  nextConfig.includes('"Permissions-Policy"'),
);

const loginRoute = read("src/app/api/auth/login/route.ts");
check(
  "SEC-5",
  "Security",
  "Workspace session cookie is httpOnly + secure in production",
  includesAll(loginRoute, ["httpOnly: true", 'secure: process.env.NODE_ENV === "production"', "sameSite"]),
);

// ── 3. Technical baseline (Semrush / Verlua pre-launch) ──

check("TECH-1", "Technical", "Favicon asset exists", exists("public/favicon.svg") || exists("src/app/icon.tsx"));
check(
  "TECH-2",
  "Technical",
  "Brand logo asset + component",
  exists("public/logo.png") && read("src/components/brand/logo.tsx").includes("/logo.png"),
);
check("TECH-3", "Technical", "Web manifest linked", read("src/app/layout.tsx").includes("site.webmanifest"));
check("TECH-4", "Technical", "Custom 404 page", read("src/app/not-found.tsx").includes("Page not found"));
check("TECH-5", "Technical", "robots.txt route", exists("src/app/robots.ts"));
check("TECH-6", "Technical", "sitemap route", exists("src/app/sitemap.ts"));
check("TECH-7", "Technical", "Privacy policy page", exists("src/app/privacy/page.tsx"));

// ── 4. Accessibility (WCAG 2.1 AA baseline — Verlua § Accessibility) ──

const layout = read("src/app/layout.tsx");
check("A11Y-1", "Accessibility", "HTML lang attribute", layout.includes('lang="en"'));
check("A11Y-2", "Accessibility", "Viewport metadata export", layout.includes("export const viewport"));
check("A11Y-3", "Accessibility", "Skip to main content link", read("src/components/layout/skip-link.tsx").includes("#main-content"));
check("A11Y-4", "Accessibility", "Main landmark id on landing", read("src/components/landing/fb-landing-page.tsx").includes('id="main-content"'));

const formSrc = read("src/components/forms/facebook-lead-form.tsx");
check("A11Y-5", "Accessibility", "Form fields use aria-invalid", formSrc.includes("aria-invalid"));
check("A11Y-6", "Accessibility", "Live region for form status", formSrc.includes('aria-live="polite"'));
check(
  "A11Y-7",
  "Accessibility",
  "Focus-visible styles on primary CTAs",
  read("src/components/landing/layout.tsx").includes("focus-visible:outline"),
);

// ── 5. Performance (Verlua § Performance & Speed) ──

check("PERF-1", "Performance", "Fonts use display: swap", layout.includes('display: "swap"'));
check(
  "PERF-2",
  "Performance",
  "Meta Pixel loads lazyOnload",
  read("src/components/analytics/meta-pixel.tsx").includes('strategy="lazyOnload"'),
);
check(
  "PERF-3",
  "Performance",
  "Brand logo component (no remote image dependency)",
  read("src/components/brand/logo.tsx").includes("BLB"),
);
check("PERF-4", "Performance", "Expert photo served as WebP", exists("public/daniel-mehrnia.webp"));
check("PERF-4b", "Performance", "Expert photo JPEG for email", exists("public/daniel-mehrnia.jpg"));
check("PERF-5", "Performance", "browserslist defined", read("package.json").includes('"browserslist"'));

// ── 6. Analytics & tracking (WebDecodes § Measurement checks) ──

check("TRACK-1", "Analytics", "Meta Pixel component wired in layout", layout.includes("<MetaPixel"));
check("TRACK-2", "Analytics", "Lead conversion event on form submit", formSrc.includes('"Lead"') && formSrc.includes("trackMetaEvent"));
check("TRACK-2b", "Analytics", "InitiateCheckout on step 2 capture", formSrc.includes('trackMetaEvent(\n        "InitiateCheckout"'));
check("TRACK-2c", "Analytics", "Meta event deduplication ids", read("src/lib/meta-tracking.ts").includes("metaEventId"));
check("TRACK-2d", "Analytics", "Server CAPI InitiateCheckout on capture", read("src/app/api/leads/route.ts").includes('sendMetaCapiEvent("InitiateCheckout"'));
check("TRACK-2f", "Analytics", "CAPI fn/ln match params", read("src/lib/meta-capi.ts").includes("userData.fn"));
check("TRACK-2g", "Analytics", "fbc cookie helper", read("src/lib/meta-tracking.ts").includes("ensureMetaClickCookie"));
check("TRACK-2h", "Analytics", "Tracking audit script", read("scripts/tracking-audit.ts").includes("tracking:audit") || read("package.json").includes("tracking:audit"));
check("TRACK-3", "Analytics", "UTM / fbclid capture", read("src/lib/tracking.ts").includes("utm_source"));
check("TRACK-4", "Analytics", "ViewContent on landing pages", read("src/components/landing/fb-landing-page.tsx").includes("MetaViewContent"));

// ── 7b. Operating system infrastructure ──

check(
  "OPS-1",
  "Operations",
  "Vercel cron for process-idle",
  read("vercel.json").includes("/api/cron/process-idle"),
);
check(
  "OPS-2",
  "Operations",
  "Notification dry-run guard",
  exists("src/lib/notifications-config.ts"),
);
check(
  "OPS-3",
  "Operations",
  "Document blob storage module",
  read("src/lib/document-storage.ts").includes("@vercel/blob"),
);
check(
  "OPS-4",
  "Operations",
  "Twilio delivery status webhook",
  exists("src/app/api/vonage/status/route.ts"),
);
check(
  "OPS-5",
  "Operations",
  "Notification retry queue",
  exists("src/lib/notification-retry.ts"),
);
check(
  "OPS-6",
  "Operations",
  "Full attribution capture",
  includesAll(read("src/lib/tracking.ts"), ["gclid", "deviceType", "landingPageUrl"]),
);
check(
  "OPS-7",
  "Operations",
  "Go-live audit gate",
  read("package.json").includes('"go-live:audit"'),
);

// ── 8. Forms, privacy & compliance (Semrush § 11, 15) ──

check("FORM-1", "Forms & privacy", "Consent checkbox required before submit", formSrc.includes('if (!form.consent)'));
check("FORM-2", "Forms & privacy", "Consent links to privacy policy", formSrc.includes('href="/privacy"'));
check(
  "FORM-3",
  "Forms & privacy",
  "FCA / unregulated disclaimer in footer",
  read("src/components/landing/fb-landing-page.tsx").includes("META_LP_FOOTER_INTRO") &&
    read("src/lib/meta-lp-copy.ts").includes("not regulated by the FCA"),
);
check(
  "FORM-4",
  "Forms & privacy",
  "Footer privacy policy link",
  read("src/components/landing/fb-landing-page.tsx").includes('href="/privacy"'),
);

// ── 8. Companion audits referenced in launch workflow ──

check(
  "AUDIT-1",
  "Release workflow",
  "SEO audit script (npm run seo:audit)",
  read("package.json").includes('"seo:audit"'),
);
check(
  "AUDIT-2",
  "Release workflow",
  "Go-live audit gate (npm run go-live:audit)",
  read("package.json").includes('"go-live:audit"'),
);
check(
  "AUDIT-3",
  "Release workflow",
  "CRM audit script (npm run crm:audit)",
  read("package.json").includes('"crm:audit"'),
);

// ── Optional live checks on production URL ──

const baseUrl = (process.env.PRELAUNCH_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
  .replace(/\/$/, "")
  .replace(/^([^h])/, "https://$1");

async function fetchHead(path: string) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  return { status: res.status, headers: res.headers };
}

async function fetchText(path: string) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

async function runLiveChecks() {
  if (!baseUrl.startsWith("http")) {
    check("LIVE", "Live verification", "Skipped (set PRELAUNCH_BASE_URL)", true, "static only");
    return;
  }

  try {
    const home = await fetchHead("/");
    check("LIVE-1", "Live verification", "Homepage returns 200", home.status === 200, `status ${home.status}`);
    check(
      "LIVE-2",
      "Live verification",
      "Served over HTTPS",
      baseUrl.startsWith("https://"),
    );
    check(
      "LIVE-3",
      "Live verification",
      "HSTS header present",
      Boolean(home.headers.get("strict-transport-security")),
      home.headers.get("strict-transport-security") ?? "missing",
    );
    check(
      "LIVE-4",
      "Live verification",
      "Security headers on homepage",
      Boolean(home.headers.get("x-content-type-options") && home.headers.get("x-frame-options")),
    );
  } catch (err) {
    check("LIVE-1", "Live verification", "Homepage reachable", false, String(err));
  }

  for (const path of ["/favicon.svg", "/site.webmanifest", "/privacy", "/robots.txt"]) {
    try {
      const res = await fetchHead(path);
      check(`LIVE-${path}`, "Live verification", `${path} returns 200`, res.status === 200, `status ${res.status}`);
    } catch (err) {
      check(`LIVE-${path}`, "Live verification", `${path} reachable`, false, String(err));
    }
  }

  try {
    const nf = await fetchHead("/prelaunch-audit-missing-page");
    check("LIVE-404", "Live verification", "Unknown URL returns 404", nf.status === 404);
  } catch (err) {
    check("LIVE-404", "Live verification", "404 response", false, String(err));
  }

  try {
    const { body } = await fetchText("/");
    check("LIVE-FORM", "Live verification", "Quote form present on homepage", body.includes('id="quote-form"'));
    check("LIVE-PRIV", "Live verification", "Privacy link in homepage HTML", body.includes("/privacy"));
  } catch (err) {
    check("LIVE-FORM", "Live verification", "Homepage HTML checks", false, String(err));
  }
}

async function main() {
  await runLiveChecks();

  const categories = [...new Set(checks.map((c) => c.category))];
  const passed = checks.filter((c) => c.pass).length;

  console.log("\n🚀 Pre-launch web checklist\n");
  console.log("Based on: environment, security, technical, a11y, performance, tracking, forms/privacy\n");

  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\n${passed}/${checks.length} passed`);
  console.log("\nFull release gate: npm run audit:all\n");
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
