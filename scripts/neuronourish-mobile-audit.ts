#!/usr/bin/env npx tsx
/**
 * Mobile responsiveness audit for NeuroNourish marketing site.
 *
 * Run: npm run neuronourish:mobile
 * Live: NN_MOBILE_BASE_URL=https://neuronourish.clinic npm run neuronourish:mobile
 *
 * Reference: https://web.dev/learn/design/responsive/
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { NN_MOBILE_URLS, NN_TOUCH_TARGET_PX } from "../src/lib/neuronourish-mobile";

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

// ── Viewport ──

const layout = read("src/app/layout.tsx");
check(
  "V1",
  "Viewport",
  "device-width viewport exported",
  layout.includes('width: "device-width"') && layout.includes("initialScale: 1"),
);
check("V2", "Viewport", "viewport-fit cover for notched devices", layout.includes('viewportFit: "cover"'));
check("V3", "Viewport", "HTML lang=en", layout.includes('lang="en"'));

// ── Navigation ──

const header = read("src/components/neuronourish/header.tsx");
const headerMobile = read("src/components/neuronourish/header-nav-mobile.tsx");
check("N1", "Navigation", "Mobile header component exists", header.includes("NeuroNourishHeader"));
check(
  "N2",
  "Navigation",
  "Hamburger menu below lg breakpoint",
  headerMobile.includes("lg:hidden") && headerMobile.includes("Menu"),
);
check(
  "N3",
  "Navigation",
  "Menu toggle has aria-expanded and aria-controls",
  headerMobile.includes("aria-expanded") && headerMobile.includes("aria-controls"),
);
check(
  "N4",
  "Navigation",
  "Mobile panel lists NN_NAV links",
  headerMobile.includes("NN_NAV.links") && headerMobile.includes("ctaDiscovery"),
);
check(
  "N5",
  "Navigation",
  "Body scroll locked when menu open",
  headerMobile.includes('document.body.style.overflow = open ? "hidden"'),
);
check(
  "N6",
  "Navigation",
  "Header safe-area inset padding",
  header.includes("safe-area-inset-top"),
);

const shell = read("src/components/neuronourish/shell.tsx");
check(
  "N7",
  "Navigation",
  "Main landmark id for skip link",
  shell.includes('id="main-content"'),
);
check(
  "N8",
  "Navigation",
  "Shell prevents horizontal overflow",
  shell.includes("overflow-x-clip"),
);

// ── Touch targets ──

check(
  "T1",
  "Touch targets",
  `GoldButton min height ${NN_TOUCH_TARGET_PX}px`,
  shell.includes("min-h-[48px]") && shell.includes("GoldButton"),
);
check(
  "T2",
  "Touch targets",
  "Quiz option pills min 48px",
  read("src/components/forms/option-pills.tsx").includes("min-h-[48px]"),
);
check(
  "T3",
  "Touch targets",
  "Option pills stack on narrow screens",
  read("src/components/forms/option-pills.tsx").includes("grid-cols-1 sm:grid-cols-2"),
);
check(
  "T4",
  "Touch targets",
  "Inputs use touch-input 16px on mobile",
  read("src/components/ui/input.tsx").includes("touch-input") &&
    read("src/app/globals.css").includes(".touch-input"),
);
check(
  "T5",
  "Touch targets",
  "FAQ summary rows min 48px",
  read("src/components/neuronourish/content/faq-section.tsx").includes("min-h-[48px]"),
);

// ── Layout ──

const home = read("src/components/neuronourish/home-page.tsx");
check(
  "L1",
  "Layout",
  "Hero headline responsive scale",
  home.includes("text-4xl") && home.includes("sm:text-5xl"),
);
check(
  "L2",
  "Layout",
  "CTA groups stack on mobile",
  home.includes("flex-col") && home.includes("sm:flex-row"),
);
check(
  "L3",
  "Layout",
  "Content grids stack until lg",
  home.includes("lg:grid-cols-2"),
);
check(
  "L4",
  "Layout",
  "Footer responsive columns",
  shell.includes("sm:grid-cols-2") && shell.includes("lg:grid-cols-4"),
);

const copy = read("src/lib/neuronourish-copy.ts");
check(
  "L5",
  "Layout",
  "Short quiz CTA label for narrow header",
  copy.includes("ctaQuizShort"),
);

// ── Forms & funnel ──

check(
  "F1",
  "Forms",
  "Quiz capture stacks on mobile",
  read("src/components/neuronourish/brain-health-quiz.tsx").includes("sm:grid-cols-2"),
);
check(
  "F2",
  "Forms",
  "Assessment CTAs full width on mobile",
  read("src/app/assessment/page.tsx").includes("w-full") && read("src/app/assessment/page.tsx").includes("sm:w-auto"),
);
check(
  "F3",
  "Forms",
  "Programme CTAs full width on mobile",
  read("src/app/programme/page.tsx").includes("w-full") && read("src/app/programme/page.tsx").includes("sm:w-auto"),
);
check(
  "F4",
  "Forms",
  "Calendly facade button min 48px",
  read("src/components/neuronourish/calendly-embed.tsx").includes("min-h-[48px]"),
);

// ── Scroll ──

check(
  "S1",
  "Scroll",
  "Anchor scroll-margin for sticky header",
  read("src/app/globals.css").includes("scroll-margin-top"),
);
check("S2", "Scroll", "Smooth scroll on html", layout.includes("scroll-smooth"));

// ── Documentation ──

check(
  "DOC",
  "Documentation",
  "Mobile responsiveness checklist doc exists",
  existsSync("docs/NEURONOURISH_MOBILE_RESPONSIVE.md"),
);
check(
  "LIB",
  "Documentation",
  "neuronourish-mobile.ts defines breakpoints",
  existsSync("src/lib/neuronourish-mobile.ts"),
);

// ── Live HTML ──

async function runLiveChecks() {
  const baseUrl =
    process.env.NN_MOBILE_BASE_URL ||
    process.env.NN_PAGESPEED_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  for (const path of NN_MOBILE_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers: { Accept: "text/html" } });
      const html = await res.text();
      check(`HTTP-${path}`, "Live crawl", `${path} returns 200`, res.ok, `status ${res.status}`);

      if (path === "/") {
        check(
          "LIVE-viewport",
          "Live crawl",
          "HTML includes mobile viewport meta",
          /width=device-width/i.test(html) && /initial-scale=1/i.test(html),
        );
        check(
          "LIVE-main",
          "Live crawl",
          "HTML includes main-content landmark",
          html.includes('id="main-content"'),
        );
        check(
          "LIVE-menu",
          "Live crawl",
          "HTML includes mobile menu toggle",
          /Open navigation menu|aria-expanded/i.test(html),
        );
        check(
          "LIVE-overflow",
          "Live crawl",
          "No inline width > 500px on homepage",
          !html.match(/style="[^"]*width:\s*[5-9]\d{2,}px/),
          "inline widths ok",
          false,
        );
      }
    } catch (err) {
      check(`HTTP-${path}`, "Live crawl", `${path} reachable`, false, String(err));
    }
  }
}

async function main() {
  await runLiveChecks();

  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n📱 NeuroNourish mobile responsiveness audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 mobile checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before mobile sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_MOBILE_RESPONSIVE.md\n");
  console.log("Manual: Chrome DevTools → iPhone SE (375px) on /, /quiz, /discovery\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
