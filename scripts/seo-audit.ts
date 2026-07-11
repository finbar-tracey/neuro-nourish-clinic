#!/usr/bin/env npx tsx
/**
 * Screaming Frog–style SEO audit for the paid conversion subdomain.
 * Run: npm run seo:audit
 * Optional live crawl: SEO_AUDIT_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run seo:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AD_ANGLE_VALUES } from "../src/lib/ad-angles";

type Check = { id: string; category: string; name: string; pass: boolean; detail?: string };

const checks: Check[] = [];
const root = join(import.meta.dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function check(id: string, category: string, name: string, pass: boolean, detail?: string) {
  checks.push({ id, category, name, pass, detail });
}

function includesAll(haystack: string, needles: string[]) {
  return needles.every((n) => haystack.includes(n));
}

// --- Static source checks (Screaming Frog On-Page + Directives) ---

const seoLib = read("src/lib/seo.ts");
check(
  "D1",
  "Directives",
  "Shared NOINDEX_ROBOTS blocks index & follow",
  seoLib.includes("index: false") && seoLib.includes("follow: false"),
);
check(
  "D2",
  "Directives",
  "buildPageMetadata applies robots + canonical + OG",
  includesAll(seoLib, ["robots: NOINDEX_ROBOTS", "alternates: { canonical }", "openGraph:"]),
);

const nextConfig = read("next.config.ts");
check(
  "D3",
  "Directives",
  "X-Robots-Tag header (noindex, nofollow, noarchive)",
  nextConfig.includes('key: "X-Robots-Tag"') && nextConfig.includes("noindex, nofollow, noarchive"),
);

const layout = read("src/app/layout.tsx");
check("P1", "Page elements", "Root layout sets metadataBase", layout.includes("metadataBase:"));
check("P2", "Page elements", "HTML lang=en", layout.includes('lang="en"'));

for (const file of ["src/app/page.tsx", "src/app/lp/page.tsx", "src/app/lp/[angle]/page.tsx"]) {
  const src = read(file);
  check(
    "T1",
    "Title & description",
    `${file} uses buildPageMetadata`,
    src.includes("buildPageMetadata"),
  );
}

const fbLanding = read("src/components/landing/fb-landing-page.tsx");
check(
  "S1",
  "Structured data",
  "JSON-LD removed from landing (noindex pages)",
  !fbLanding.includes("LocalBusinessSchema") &&
    !fbLanding.includes("ReviewSchema") &&
    !read("src/components/landing/faq-section.tsx").includes("application/ld+json"),
);

const heroCopy = read("src/components/landing/hero-copy.tsx");
const h1Count = (heroCopy.match(/<h1/g) ?? []).length + (fbLanding.match(/<h1/g) ?? []).length;
check(
  "H1",
  "Headings",
  "Exactly one H1 in landing page markup",
  h1Count === 1,
  h1Count === 1 ? undefined : `found ${h1Count}`,
);

check(
  "R1",
  "robots.txt",
  "robots.ts exists and disallows /workspace/ + /api/",
  includesAll(read("src/app/robots.ts"), ["disallow:", "/workspace/", "/api/"]),
);

const sitemap = read("src/app/sitemap.ts");
check(
  "SM1",
  "Sitemap",
  "Sitemap empty (noindex URLs excluded)",
  sitemap.includes("return []"),
);

check(
  "W1",
  "Workspace",
  "Workspace layout noindex",
  read("src/app/workspace/layout.tsx").includes("NOINDEX_ROBOTS"),
);

check(
  "404",
  "Response codes",
  "Custom 404 with noindex",
  read("src/app/not-found.tsx").includes("NOINDEX_ROBOTS"),
);

check(
  "ENV",
  "Configuration",
  ".env.example documents NEXT_PUBLIC_SITE_URL",
  read(".env.example").includes("NEXT_PUBLIC_SITE_URL"),
);

const siteUrl = read("src/lib/site-url.ts");
check("ENV2", "Configuration", "getSiteUrl helper exists", siteUrl.includes("getSiteUrl"));

// --- Optional live HTTP crawl ---

const baseUrl = (process.env.SEO_AUDIT_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
  .replace(/\/$/, "")
  .replace(/^([^h])/, "https://$1");

async function fetchText(path: string): Promise<{ status: number; headers: Headers; body: string }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function runLiveChecks() {
  if (!baseUrl.startsWith("http")) {
    check("LIVE", "Live crawl", "Skipped (set SEO_AUDIT_BASE_URL for HTTP checks)", true, "static only");
    return;
  }

  const paths = ["/", "/lp", ...AD_ANGLE_VALUES.filter((a) => a !== "default").map((a) => `/lp/${a}`)];

  for (const path of paths) {
    try {
      const { status, headers, body } = await fetchText(path);
      check(
        `HTTP-${path}`,
        "Live crawl",
        `${path} returns 200`,
        status === 200,
        `status ${status}`,
      );

      const xRobots = headers.get("x-robots-tag") ?? "";
      check(
        `XR-${path}`,
        "Directives",
        `${path} X-Robots-Tag noindex`,
        xRobots.toLowerCase().includes("noindex"),
        xRobots || "missing",
      );

      check(
        `META-${path}`,
        "Directives",
        `${path} meta robots noindex`,
        /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(body),
      );

      check(
        `CAN-${path}`,
        "Canonical",
        `${path} has canonical link`,
        /<link[^>]+rel=["']canonical["']/i.test(body),
      );

      check(
        `OG-${path}`,
        "Social",
        `${path} has og:title`,
        /property=["']og:title["']/i.test(body),
      );

      check(
        `H1L-${path}`,
        "Headings",
        `${path} exactly one visible H1`,
        (body.match(/<h1[\s>]/gi) ?? []).length === 1,
        `count ${(body.match(/<h1[\s>]/gi) ?? []).length}`,
      );

      check(
        `LD-${path}`,
        "Structured data",
        `${path} no JSON-LD`,
        !/<script[^>]+type=["']application\/ld\+json["']/i.test(body),
      );
    } catch (err) {
      check(`HTTP-${path}`, "Live crawl", `${path} reachable`, false, String(err));
    }
  }

  try {
    const robots = await fetchText("/robots.txt");
    check("HTTP-robots", "robots.txt", "/robots.txt returns 200", robots.status === 200);
    check(
      "HTTP-robots-disallow",
      "robots.txt",
      "Disallows /workspace/",
      robots.body.includes("/workspace/"),
    );
  } catch (err) {
    check("HTTP-robots", "robots.txt", "/robots.txt reachable", false, String(err));
  }

  try {
    const sm = await fetchText("/sitemap.xml");
    check("HTTP-sitemap", "Sitemap", "/sitemap.xml returns 200", sm.status === 200);
    check(
      "HTTP-sitemap-empty",
      "Sitemap",
      "Sitemap has no URL entries",
      !sm.body.includes("<loc>"),
    );
  } catch (err) {
    check("HTTP-sitemap", "Sitemap", "/sitemap.xml reachable", false, String(err));
  }

  try {
    const nf = await fetchText("/this-page-does-not-exist-seo-audit");
    check("HTTP-404", "Response codes", "Unknown URL returns 404", nf.status === 404);
  } catch (err) {
    check("HTTP-404", "Response codes", "404 check", false, String(err));
  }
}

async function main() {
  await runLiveChecks();

  const categories = [...new Set(checks.map((c) => c.category))];
  const passed = checks.filter((c) => c.pass).length;

  console.log("\n🐸 Screaming Frog SEO checklist\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
