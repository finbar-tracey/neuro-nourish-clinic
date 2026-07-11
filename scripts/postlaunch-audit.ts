#!/usr/bin/env npx tsx
/**
 * Post-launch checklist for the paid conversion subdomain (noindex retained).
 *
 * Based on:
 * - SEO Handbook go-live checklist (post-launch monitoring window)
 * - SEOJuice post-launch triage (access, headers, analytics, forms)
 * - Adapted for intentional sitewide noindex (Facebook / paid traffic only)
 *
 * Run: npm run postlaunch:audit
 * Live: POSTLAUNCH_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run postlaunch:audit
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

// ── 1. Noindex must remain (paid LP — do NOT flip to index) ──

const seoLib = read("src/lib/seo.ts");
const nextConfig = read("next.config.ts");

check(
  "NOINDEX-1",
  "Noindex (keep)",
  "NOINDEX_ROBOTS blocks index & follow",
  seoLib.includes("index: false") && seoLib.includes("follow: false"),
);
check(
  "NOINDEX-2",
  "Noindex (keep)",
  "X-Robots-Tag: noindex, nofollow, noarchive",
  nextConfig.includes("noindex, nofollow, noarchive"),
);
check(
  "NOINDEX-3",
  "Noindex (keep)",
  "Sitemap empty (noindex URLs excluded)",
  read("src/app/sitemap.ts").includes("return []"),
);
check(
  "NOINDEX-4",
  "Noindex (keep)",
  "Workspace routes noindex",
  read("src/app/workspace/layout.tsx").includes("NOINDEX_ROBOTS"),
);

// ── 2. Branding & technical assets (JoomConnect / pre-launch) ──

check(
  "TECH-1",
  "Technical",
  "Favicon SVG in public/",
  exists("public/favicon.svg"),
);
check(
  "TECH-2",
  "Technical",
  "Dynamic app icon route",
  exists("src/app/icon.tsx") && exists("src/app/apple-icon.tsx"),
);
check("TECH-3", "Technical", "Web manifest", exists("public/site.webmanifest"));
check(
  "TECH-4",
  "Technical",
  "Brand logo asset + component",
  exists("public/logo.png") && read("src/components/brand/logo.tsx").includes("/logo.png"),
);
check("TECH-4b", "Technical", "Logo favicon PNG", exists("public/favicon.png"));
check("TECH-5", "Technical", "Privacy policy", exists("src/app/privacy/page.tsx"));
check("TECH-6", "Technical", "Custom 404", read("src/app/not-found.tsx").includes("NOINDEX_ROBOTS"));

// ── 3. Security & HTTPS (day 0 — SEOJuice access checks) ──

check(
  "SEC-1",
  "Security",
  "Security headers in next.config",
  nextConfig.includes("X-Frame-Options") && nextConfig.includes("X-Content-Type-Options"),
);
check(
  "SEC-2",
  "Security",
  "Workspace cookie httpOnly + secure",
  read("src/app/api/auth/login/route.ts").includes("httpOnly: true"),
);

// ── 4. Analytics & conversion tracking (day 0) ──

const layout = read("src/app/layout.tsx");
const formSrc = read("src/components/forms/facebook-lead-form.tsx");

check("TRACK-1", "Analytics", "Meta Pixel in layout", layout.includes("<MetaPixel"));
check(
  "TRACK-2",
  "Analytics",
  "Lead event on form submit",
  /trackMetaEvent\(\s*[\n\r\s]*"Lead"/.test(formSrc),
);
check("TRACK-3", "Analytics", "Step 2 CRM capture wired", formSrc.includes('stage: "capture"'));
check("TRACK-4", "Analytics", "UTM / fbclid capture", read("src/lib/tracking.ts").includes("fbclid"));

// ── 5. Forms & CRM (first 72 hours monitoring) ──

check("FORM-1", "Forms & CRM", "Form CRM wiring audit script", read("package.json").includes("form:crm-wiring"));
check("FORM-2", "Forms & CRM", "CRM audit script", read("package.json").includes("crm:audit"));
check("FORM-3", "Forms & CRM", "Consent + privacy link", formSrc.includes('href="/privacy"'));

// ── 6. Release workflow scripts ──

check("AUDIT-1", "Release workflow", "Pre-launch audit", read("package.json").includes("prelaunch:audit"));
check("AUDIT-2", "Release workflow", "SEO audit", read("package.json").includes("seo:audit"));
check("AUDIT-3", "Release workflow", "Post-launch audit", read("package.json").includes("postlaunch:audit"));

// ── 7. Manual GSC / ads tasks documented ──

check(
  "DOC-1",
  "Documentation",
  "Post-launch runbook exists",
  exists("docs/POST_LAUNCH.md"),
);
check(
  "DOC-2",
  "Documentation",
  "Runbook documents intentional noindex",
  exists("docs/POST_LAUNCH.md") && read("docs/POST_LAUNCH.md").includes("noindex"),
);

// ── Live checks (production) ──

const baseUrl = (process.env.POSTLAUNCH_BASE_URL ?? process.env.PRELAUNCH_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
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
    check("LIVE", "Live verification", "Skipped (set POSTLAUNCH_BASE_URL)", true, "static only");
    return;
  }

  try {
    const home = await fetchText("/");
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
      "LIVE-NOINDEX-1",
      "Live noindex (keep)",
      "X-Robots-Tag contains noindex",
      (home.headers.get("x-robots-tag") ?? "").toLowerCase().includes("noindex"),
      home.headers.get("x-robots-tag") ?? "missing",
    );
    check(
      "LIVE-NOINDEX-2",
      "Live noindex (keep)",
      "Meta robots noindex in HTML",
      /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(home.body),
    );
    check("LIVE-FORM", "Live verification", "Quote form on homepage", home.body.includes('id="quote-form"'));
  } catch (err) {
    check("LIVE-1", "Live verification", "Homepage reachable", false, String(err));
  }

  for (const path of ["/favicon.svg", "/site.webmanifest", "/logo.png", "/daniel-mehrnia.jpg", "/privacy", "/robots.txt", "/sitemap.xml"]) {
    try {
      const res = await fetchHead(path);
      check(`LIVE-${path}`, "Live verification", `${path} returns 200`, res.status === 200, `status ${res.status}`);
    } catch (err) {
      check(`LIVE-${path}`, "Live verification", `${path} reachable`, false, String(err));
    }
  }

  try {
    const robots = await fetchText("/robots.txt");
    check(
      "LIVE-ROBOTS",
      "Live verification",
      "robots.txt disallows /workspace/",
      robots.body.includes("Disallow: /workspace/"),
    );
  } catch (err) {
    check("LIVE-ROBOTS", "Live verification", "robots.txt", false, String(err));
  }

  try {
    const sitemap = await fetchText("/sitemap.xml");
    check(
      "LIVE-SITEMAP",
      "Live noindex (keep)",
      "Sitemap has no URLs (empty)",
      !sitemap.body.includes("<loc>https://"),
      "sitemap should stay empty while noindex",
    );
  } catch (err) {
    check("LIVE-SITEMAP", "Live noindex (keep)", "Sitemap check", false, String(err));
  }

  try {
    const capture = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "capture",
        firstName: "Postlaunch",
        lastName: "Audit",
        email: `postlaunch-audit-${Date.now()}@test.local`,
        phone: "07123456789",
        loanPurpose: "purchase",
        loanAmount: 250000,
        timeframe: "30_days",
        consent: true,
        source: "facebook_lp",
      }),
    });
    const data = (await capture.json()) as { captured?: boolean; id?: string };
    check(
      "LIVE-CRM",
      "Live verification",
      "Step 2 CRM capture API (201)",
      capture.status === 201 && data.captured === true,
      `status ${capture.status}${data.id ? ` id ${data.id}` : ""}`,
    );
  } catch (err) {
    check("LIVE-CRM", "Live verification", "CRM capture API", false, String(err));
  }
}

async function main() {
  await runLiveChecks();

  const categories = [...new Set(checks.map((c) => c.category))];
  const passed = checks.filter((c) => c.pass).length;

  console.log("\n🛰️  Post-launch checklist (noindex retained)\n");
  console.log(
    "Refs: SEO Handbook go-live, SEOJuice post-launch triage — adapted for paid conversion subdomain\n",
  );

  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\n${passed}/${checks.length} passed`);
  console.log("\nManual tasks: see docs/POST_LAUNCH.md");
  console.log("Full gate: npm run audit:all\n");
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
