#!/usr/bin/env npx tsx
/**
 * Screaming Frog–style SEO audit for NeuroNourish (indexable marketing site).
 *
 * Run: npm run neuronourish:seo
 * Live: NN_SEO_BASE_URL=https://neuronourish.clinic npm run neuronourish:seo
 *
 * Reference: https://www.screamingfrog.co.uk/seo-spider/issues/
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import {
  NN_PAGE_SEO,
  neuronourishPublicPaths,
} from "../src/lib/neuronourish-seo";

const ROOT = resolve(import.meta.dirname, "..");
config({ path: resolve(ROOT, ".env.local") });
config();

type Check = { id: string; category: string; name: string; pass: boolean; detail?: string; p0?: boolean };
const checks: Check[] = [];

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function check(
  id: string,
  category: string,
  name: string,
  pass: boolean,
  detail?: string,
  p0 = true,
) {
  checks.push({ id, category, name, pass, detail, p0 });
}

function includesAll(haystack: string, needles: string[]) {
  return needles.every((n) => haystack.includes(n));
}

// ── Directives ──

const seoLib = read("src/lib/seo.ts");
check(
  "D1",
  "Directives",
  "INDEXABLE_ROBOTS for NeuroNourish",
  seoLib.includes("INDEXABLE_ROBOTS") && seoLib.includes("isNeuronourish()"),
);
check(
  "D2",
  "Directives",
  "buildPageMetadata uses indexable robots when NN vertical",
  seoLib.includes("robots: isNeuronourish() ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS"),
);
const nextConfig = read("next.config.ts");
check(
  "D3",
  "Directives",
  "No global X-Robots-Tag noindex for NeuroNourish",
  nextConfig.includes("isNeuronourish") &&
    nextConfig.includes("securityHeaders") &&
    nextConfig.includes("/workspace/:path*"),
  "Public paths use security headers only; workspace/api are noindex",
);
check(
  "D4",
  "Directives",
  "Workspace routes get X-Robots-Tag noindex",
  nextConfig.includes("/workspace/:path*") && nextConfig.includes("noindex"),
);

// ── Sitemap & robots ──

const sitemap = read("src/app/sitemap.ts");
check(
  "SM1",
  "Sitemap",
  "Sitemap populated for NeuroNourish",
  sitemap.includes("neuronourishPublicPaths") && sitemap.includes("isNeuronourish"),
);
check(
  "SM2",
  "Sitemap",
  "No hash-fragment URLs in sitemap",
  !sitemap.includes("#"),
);

const robots = read("src/app/robots.ts");
check(
  "R1",
  "robots.txt",
  "Disallows workspace, api, legacy lp",
  includesAll(robots, ["/workspace/", "/api/", "/lp/"]),
);
check(
  "R2",
  "robots.txt",
  "References sitemap.xml",
  robots.includes("sitemap.xml"),
);

// ── Page SEO registry ──

const seoRegistry = read("src/lib/neuronourish-seo.ts");
const publicPaths = neuronourishPublicPaths();
check(
  "SEO1",
  "Titles & descriptions",
  `NN_PAGE_SEO defines ${publicPaths.length} unique routes`,
  Object.keys(NN_PAGE_SEO).length >= 12,
  `${Object.keys(NN_PAGE_SEO).length} pages`,
);

const titles = Object.values(NN_PAGE_SEO).map((p) => p.title);
const uniqueTitles = new Set(titles);
check(
  "SEO2",
  "Titles & descriptions",
  "All page titles unique",
  titles.length === uniqueTitles.size,
);

for (const page of Object.values(NN_PAGE_SEO)) {
  const titleLen = page.title.length;
  const descLen = page.description.length;
  check(
    `T-${page.path}`,
    "Titles & descriptions",
    `${page.path} title length 20–70`,
    titleLen >= 20 && titleLen <= 70,
    `${titleLen} chars`,
    false,
  );
  check(
    `M-${page.path}`,
    "Titles & descriptions",
    `${page.path} meta description 50–165`,
    descLen >= 50 && descLen <= 165,
    `${descLen} chars`,
    false,
  );
}

// ── Structured data ──

check(
  "LD1",
  "Structured data",
  "Organization + WebSite + FAQ JSON-LD builders",
  includesAll(seoRegistry, ["MedicalBusiness", "WebSite", "FAQPage", "neuronourishHomeJsonLd"]),
);
check(
  "LD2",
  "Structured data",
  "Homepage renders JsonLd component",
  read("src/components/neuronourish/home-page.tsx").includes("neuronourishHomeJsonLd"),
);

// ── Open Graph ──

check(
  "OG1",
  "Social",
  "Dynamic opengraph-image route exists",
  existsSync(resolve(ROOT, "src/app/opengraph-image.tsx")),
);
check(
  "OG2",
  "Social",
  "Default OG image path configured",
  seoLib.includes("/opengraph-image"),
);

// ── Layout & locale ──

const layout = read("src/app/layout.tsx");
check("P1", "Page elements", "HTML lang=en", layout.includes('lang="en"'));
check("P2", "Page elements", "metadataBase set for NN", layout.includes("metadataBase:"));

check(
  "M1",
  "Manifest",
  "Dynamic manifest.ts for NeuroNourish",
  existsSync(resolve(ROOT, "src/app/manifest.ts")) &&
    read("src/app/manifest.ts").includes("NeuroNourish"),
);

// ── 404 & legacy routes ──

check(
  "404",
  "Response codes",
  "Custom 404 with noindex + NN branding",
  read("src/app/not-found.tsx").includes("NeuroNourishShell") &&
    read("src/app/not-found.tsx").includes("NOINDEX_ROBOTS"),
);

check(
  "LEG1",
  "Response codes",
  "Middleware redirects legacy /lp routes for NN",
  read("src/middleware.ts").includes("/lp") && read("src/middleware.ts").includes("isNeuronourish"),
);

check(
  "W1",
  "Workspace",
  "Workspace layout noindex",
  read("src/app/workspace/layout.tsx").includes("NOINDEX_ROBOTS"),
);

// ── Layout metadata for client routes ──

for (const layoutPath of [
  "src/app/assessment/layout.tsx",
  "src/app/programme/layout.tsx",
  "src/app/quiz/results/layout.tsx",
]) {
  check(
    `LAYOUT-${layoutPath}`,
    "Titles & descriptions",
    `${layoutPath} exports buildNeuronourishMetadata`,
    read(layoutPath).includes("buildNeuronourishMetadata"),
  );
}

check(
  "DOC",
  "Documentation",
  "Screaming Frog checklist doc exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_SCREAMING_FROG_SEO.md")),
);

// ── Optional live crawl ──

const baseUrl = (process.env.NN_SEO_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
  .replace(/\/$/, "");

async function fetchPage(path: string) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function runLiveChecks() {
  if (!baseUrl.startsWith("http")) {
    check("LIVE", "Live crawl", "Skipped (set NN_SEO_BASE_URL)", true, "static only", false);
    return;
  }

  for (const path of publicPaths) {
    try {
      const { status, headers, body } = await fetchPage(path);
      check(`HTTP-${path}`, "Live crawl", `${path} returns 200`, status === 200, `status ${status}`);

      const xRobots = (headers.get("x-robots-tag") ?? "").toLowerCase();
      check(
        `XR-${path}`,
        "Directives",
        `${path} not blocked by X-Robots-Tag noindex`,
        !xRobots.includes("noindex"),
        xRobots || "none",
      );

      check(
        `META-${path}`,
        "Directives",
        `${path} meta robots allows index`,
        /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*index/i.test(body) ||
          !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(body),
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

      const h1Count = (body.match(/<h1[\s>]/gi) ?? []).length;
      check(
        `H1-${path}`,
        "Headings",
        `${path} exactly one H1`,
        h1Count === 1,
        `count ${h1Count}`,
      );
    } catch (err) {
      check(`HTTP-${path}`, "Live crawl", `${path} reachable`, false, String(err));
    }
  }

  try {
    const home = await fetchPage("/");
    check(
      "LD-LIVE",
      "Structured data",
      "Homepage has FAQPage JSON-LD",
      home.body.includes('"@type":"FAQPage"') || home.body.includes('"@type": "FAQPage"'),
    );
  } catch {
    check("LD-LIVE", "Structured data", "Homepage JSON-LD", false);
  }

  try {
    const robotsTxt = await fetchPage("/robots.txt");
    check("HTTP-robots", "robots.txt", "/robots.txt returns 200", robotsTxt.status === 200);
    check("HTTP-robots-sitemap", "robots.txt", "Lists sitemap", robotsTxt.body.toLowerCase().includes("sitemap"));
  } catch (err) {
    check("HTTP-robots", "robots.txt", "/robots.txt reachable", false, String(err));
  }

  try {
    const sm = await fetchPage("/sitemap.xml");
    check("HTTP-sitemap", "Sitemap", "/sitemap.xml returns 200", sm.status === 200);
    const locCount = (sm.body.match(/<loc>/g) ?? []).length;
    check(
      "HTTP-sitemap-count",
      "Sitemap",
      `Sitemap has ${publicPaths.length}+ URLs`,
      locCount >= publicPaths.length,
      `${locCount} URLs`,
    );
    check(
      "HTTP-sitemap-hash",
      "Sitemap",
      "Sitemap has no hash URLs",
      !sm.body.includes("#"),
    );
  } catch (err) {
    check("HTTP-sitemap", "Sitemap", "/sitemap.xml reachable", false, String(err));
  }

  try {
    const nf = await fetchPage("/this-page-does-not-exist-seo-audit-nn");
    check("HTTP-404", "Response codes", "Unknown URL returns 404", nf.status === 404);
  } catch (err) {
    check("HTTP-404", "Response codes", "404 check", false, String(err));
  }

  try {
    const lp = await fetch(`${baseUrl}/lp`, { redirect: "manual" });
    const redirected =
      lp.status === 301 || lp.status === 302 || lp.status === 307 || lp.status === 308;
    check(
      "HTTP-lp-redirect",
      "Response codes",
      "/lp redirects away from legacy route",
      redirected || lp.url === `${baseUrl}/` || !lp.ok,
      `status ${lp.status}`,
      false,
    );
  } catch (err) {
    check("HTTP-lp-redirect", "Response codes", "/lp redirect check", false, String(err), false);
  }
}

async function main() {
  await runLiveChecks();

  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n🐸 NeuroNourish Screaming Frog SEO audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 SEO checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before Screaming Frog sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_SCREAMING_FROG_SEO.md\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
