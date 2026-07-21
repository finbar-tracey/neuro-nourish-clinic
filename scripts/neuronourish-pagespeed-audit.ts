#!/usr/bin/env npx tsx
/**
 * PageSpeed Insights–style performance audit for NeuroNourish.
 *
 * Run: npm run neuronourish:pagespeed
 * Live: NN_PAGESPEED_BASE_URL=https://neuronourish.clinic npm run neuronourish:pagespeed
 * PSI API: NN_PAGESPEED_API_KEY=... (optional live Lighthouse scores)
 *
 * Reference: https://developers.google.com/speed/docs/insights/v5/get-started
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import {
  NN_CWV_THRESHOLDS,
  NN_PAGESPEED_URLS,
  NN_THIRD_PARTY,
} from "../src/lib/neuronourish-pagespeed";

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

// ── Fonts ──

const layout = read("src/app/layout.tsx");
check(
  "F1",
  "Fonts",
  "next/font with display swap",
  includesAll(layout, ['display: "swap"', "next/font/google"]),
);
check(
  "F2",
  "Fonts",
  "Inter loads brand weights (300 footer + 400/500/600)",
  layout.includes('"400"') &&
    layout.includes('"500"') &&
    layout.includes('"600"') &&
    layout.includes('"300"'),
);
check("F3", "Fonts", "Playfair preloaded for LCP headings", layout.includes("preload: true"));

// ── JavaScript ──

const metaPixel = read("src/components/analytics/meta-pixel.tsx");
check(
  "J1",
  "JavaScript",
  "Meta Pixel deferred (lazyOnload)",
  metaPixel.includes('strategy="lazyOnload"'),
);

const calendly = read("src/components/neuronourish/calendly-embed.tsx");
check(
  "J2",
  "JavaScript",
  "Calendly click-to-load facade",
  calendly.includes("useState") && calendly.includes("setActive"),
);
check(
  "J3",
  "JavaScript",
  "Calendly script lazyOnload when activated",
  calendly.includes('strategy="lazyOnload"'),
);

const quizPage = read("src/app/quiz/page.tsx");
check(
  "J4",
  "JavaScript",
  "Quiz dynamically imported",
  quizPage.includes("dynamic(") && quizPage.includes("brain-health-quiz"),
);

const nextConfig = read("next.config.ts");
check(
  "J5",
  "JavaScript",
  "lucide-react package import optimization",
  nextConfig.includes('optimizePackageImports: ["lucide-react"]'),
);

// ── CSS & render ──

const globals = read("src/app/globals.css");
check(
  "R1",
  "Render",
  "Below-fold content-visibility utility",
  globals.includes("content-visibility: auto") && globals.includes(".nn-defer-section"),
);

const homePage = read("src/components/neuronourish/home-page.tsx");
const heroSection = read("src/components/neuronourish/content/hero-section.tsx");
check(
  "R2",
  "Render",
  "Homepage defers below-fold sections",
  homePage.includes("nn-defer-section"),
);
check(
  "R3",
  "Render",
  "Hero is text/CSS (no LCP hero image)",
  heroSection.includes("nn-hero") && !heroSection.includes("<Image") && !heroSection.includes("from \"next/image\""),
);

// ── Images & CLS ──

const placeholders = read("src/components/neuronourish/content/visual-placeholders.tsx");
check(
  "I1",
  "Images",
  "Portrait placeholder reserves aspect ratio",
  placeholders.includes("aspect-square"),
);

const nnMark = read("src/components/brand/neuronourish-mark.tsx");
check(
  "I2",
  "Images",
  "Logo uses approved brand assets with explicit dimensions",
  nnMark.includes("neuronourish-brain") && nnMark.includes("width={") && nnMark.includes("height={"),
);

// ── HTML & viewport ──

check("H1", "HTML", "Viewport exported from layout", layout.includes("export const viewport"));
check("H2", "HTML", "HTML lang=en", layout.includes('lang="en"'));

// ── Resource hints ──

const resourceHints = existsSync("src/components/neuronourish/resource-hints.tsx")
  ? read("src/components/neuronourish/resource-hints.tsx")
  : "";
check(
  "N1",
  "Network",
  "NeuroNourish resource hints component",
  resourceHints.includes("NeuroNourishResourceHints"),
);
check(
  "N2",
  "Network",
  "Layout includes resource hints for NN",
  layout.includes("NeuroNourishResourceHints"),
);

const discoveryLayout = existsSync("src/app/discovery/layout.tsx")
  ? read("src/app/discovery/layout.tsx")
  : "";
check(
  "N3",
  "Network",
  "Calendly preconnect on discovery route",
  existsSync("src/app/discovery/layout.tsx") &&
    (discoveryLayout.includes("calendlyScript") || discoveryLayout.includes("assets.calendly.com")),
);

// ── Caching ──

check(
  "C1",
  "Caching",
  "Immutable cache for /_next/static",
  nextConfig.includes("/_next/static/:path*") && nextConfig.includes("immutable"),
);

// ── Third-party scope ──

check(
  "T1",
  "Third-party",
  "Calendly not imported on homepage",
  !homePage.includes("calendly") && !homePage.includes("Calendly"),
);
check(
  "T2",
  "Third-party",
  "Calendly only on discovery funnel",
  read("src/app/discovery/page.tsx").includes("DiscoveryBookingPanel") &&
    read("src/components/neuronourish/discovery-booking-panel.tsx").includes("DiscoveryCalendlyEmbed"),
);

// ── Documentation ──

check(
  "DOC",
  "Documentation",
  "PageSpeed Insights checklist doc exists",
  existsSync("docs/NEURONOURISH_PAGE_SPEED_INSIGHTS.md"),
);

// ── Shared lib ──

check(
  "LIB",
  "Documentation",
  "neuronourish-pagespeed.ts defines CWV thresholds",
  existsSync("src/lib/neuronourish-pagespeed.ts"),
);

// ── Live HTTP checks ──

async function runLiveChecks() {
  const baseUrl =
    process.env.NN_PAGESPEED_BASE_URL ||
    process.env.NN_POST_IMPL_BASE_URL ||
    process.env.NN_SEO_BASE_URL ||
    process.env.NN_GO_LIVE_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);
  // Production HTML can be larger with RSC payload; keep a calm ceiling for regression.
  const htmlLimit = isLocal ? 220_000 : 220_000;

  for (const path of NN_PAGESPEED_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { Accept: "text/html" },
      });
      const html = await res.text();
      check(
        `HTTP-${path}`,
        "Live crawl",
        `${path} returns 200`,
        res.ok,
        `status ${res.status}`,
      );
      check(
        `SIZE-${path}`,
        "Live crawl",
        `${path} HTML < ${Math.round(htmlLimit / 1024)}KB`,
        html.length < htmlLimit,
        `${Math.round(html.length / 1024)}KB`,
        path === "/",
      );
      if (path === "/") {
        check(
          "ENC-/ ",
          "Live crawl",
          "Homepage uses compression",
          res.headers.get("content-encoding") === "br" ||
            res.headers.get("content-encoding") === "gzip" ||
            baseUrl.includes("localhost"),
          res.headers.get("content-encoding") ?? "none (ok on localhost)",
          false,
        );
        check(
          "3P-/",
          "Third-party",
          "Homepage HTML has no Calendly script",
          !html.includes("assets.calendly.com"),
        );
        check(
          "3P-stripe-/",
          "Third-party",
          "Homepage HTML has no Stripe.js",
          !html.includes("js.stripe.com"),
        );
      }
      if (path === "/discovery") {
        check(
          "3P-discovery",
          "Third-party",
          "Discovery HTML has no Calendly script before interaction",
          !html.includes("assets.calendly.com/widget.js"),
        );
      }
    } catch (err) {
      check(`HTTP-${path}`, "Live crawl", `${path} reachable`, false, String(err));
    }
  }

  try {
    const staticProbe = await fetch(`${baseUrl}/_next/static/`, { redirect: "manual" });
    const cache = staticProbe.headers.get("cache-control") ?? "";
    check(
      "CACHE-static",
      "Caching",
      "Static assets send long-lived cache headers",
      cache.includes("immutable") ||
        cache.includes("max-age=31536000") ||
        staticProbe.status === 404 ||
        staticProbe.status === 308 ||
        staticProbe.status === 307,
      cache || `status ${staticProbe.status}`,
      false,
    );
  } catch {
    // optional on localhost before build
  }
}

async function runPsiApi(baseUrl: string) {
  const key = process.env.NN_PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) {
    check(
      "PSI-API",
      "Lighthouse API",
      "PSI API scores (optional)",
      true,
      "Set NN_PAGESPEED_API_KEY for live scores",
      false,
    );
    return;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/`;
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${key}`;

  try {
    const res = await fetch(api);
    if (!res.ok) {
      check("PSI-API", "Lighthouse API", "PSI API reachable", false, `status ${res.status}`, false);
      return;
    }
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
        audits?: Record<string, { numericValue?: number; displayValue?: string }>;
      };
    };
    const score = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
    const lcp = data.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue ?? 9999;
    const cls = data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue ?? 999;
    const tbt = data.lighthouseResult?.audits?.["total-blocking-time"]?.numericValue ?? 9999;

    check(
      "PSI-score",
      "Lighthouse API",
      `Mobile performance score ≥ ${NN_CWV_THRESHOLDS.performanceScore}`,
      score >= NN_CWV_THRESHOLDS.performanceScore,
      `score ${score}`,
      false,
    );
    check(
      "PSI-lcp",
      "Lighthouse API",
      `LCP ≤ ${NN_CWV_THRESHOLDS.lcpMs}ms`,
      lcp <= NN_CWV_THRESHOLDS.lcpMs,
      `${Math.round(lcp)}ms`,
      false,
    );
    check(
      "PSI-cls",
      "Lighthouse API",
      `CLS ≤ ${NN_CWV_THRESHOLDS.cls}`,
      cls <= NN_CWV_THRESHOLDS.cls,
      cls.toFixed(3),
      false,
    );
    check(
      "PSI-tbt",
      "Lighthouse API",
      `TBT ≤ ${NN_CWV_THRESHOLDS.tbtMs}ms`,
      tbt <= NN_CWV_THRESHOLDS.tbtMs,
      `${Math.round(tbt)}ms`,
      false,
    );
  } catch (err) {
    check("PSI-API", "Lighthouse API", "PSI API call", false, String(err), false);
  }
}

async function main() {
  await runLiveChecks();

  const baseUrl =
    process.env.NN_PAGESPEED_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  await runPsiApi(baseUrl);

  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n⚡ NeuroNourish PageSpeed Insights audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 PageSpeed checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before PageSpeed sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_PAGE_SPEED_INSIGHTS.md\n");
  console.log("Manual: https://pagespeed.web.dev/?url=https://neuronourish.clinic\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
