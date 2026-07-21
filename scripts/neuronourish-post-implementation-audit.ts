#!/usr/bin/env npx tsx
/**
 * NeuroNourish full post-implementation audit.
 * Aggregates marketing gates shipped in the SEO → Animation arc + live smoke.
 *
 * Run:
 *   npm run neuronourish:post-implementation
 *   NN_POST_IMPL_BASE_URL=https://neuro-nourish-clinic.vercel.app npm run neuronourish:post-implementation
 *
 * Reference: docs/NEURONOURISH_POST_IMPLEMENTATION.md
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const ROOT = resolve(import.meta.dirname, "..");
config({ path: resolve(ROOT, ".env.local") });
config();

const BASE =
  process.env.NN_POST_IMPL_BASE_URL?.replace(/\/$/, "") ||
  process.env.NN_GO_LIVE_BASE_URL?.replace(/\/$/, "") ||
  process.env.NN_SEO_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://neuro-nourish-clinic.vercel.app";

type Row = {
  id: string;
  category: string;
  name: string;
  pass: boolean;
  detail?: string;
  p0?: boolean;
};

const rows: Row[] = [];

function add(
  id: string,
  category: string,
  name: string,
  pass: boolean,
  detail?: string,
  p0 = true,
) {
  rows.push({ id, category, name, pass, detail, p0 });
}

function runNpm(script: string): { ok: boolean; detail: string } {
  const result = spawnSync("npm", ["run", script], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NN_POST_IMPL_BASE_URL: BASE,
      NN_PAGESPEED_BASE_URL: BASE,
      NN_SEO_BASE_URL: BASE,
      NN_MOBILE_BASE_URL: BASE,
      NN_GO_LIVE_BASE_URL: BASE,
    },
    timeout: 180_000,
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const verdict =
    /Verdict:\s*PASS/i.test(out) ||
    /Status:\s*COMPLIANT/i.test(out) ||
    /Brand audit:\s*PASS/i.test(out);
  const failLine = out
    .split("\n")
    .filter((l) => /Verdict:\s*FAIL|FAIL —|Status:\s*NON/i.test(l))
    .slice(0, 2)
    .join(" · ");
  if (result.status === 0 || (result.status !== 0 && verdict)) {
    return { ok: result.status === 0, detail: result.status === 0 ? "exit 0" : failLine || `exit ${result.status}` };
  }
  return {
    ok: false,
    detail: failLine || `exit ${result.status ?? "null"}`,
  };
}

const GATES: { id: string; script: string; name: string }[] = [
  { id: "G-SEO", script: "neuronourish:seo", name: "SEO (Screaming Frog gate)" },
  { id: "G-WEB", script: "neuronourish:webdev", name: "Web development" },
  { id: "G-MOB", script: "neuronourish:mobile", name: "Mobile responsive" },
  { id: "G-CRO", script: "neuronourish:cro", name: "CRO" },
  { id: "G-BRAND", script: "neuronourish:brand", name: "Brand guidelines" },
  { id: "G-DES", script: "neuronourish:design", name: "Branding & design" },
  { id: "G-ANIM", script: "neuronourish:animation", name: "Animation & motion" },
  { id: "G-PSI", script: "neuronourish:pagespeed", name: "PageSpeed static hygiene" },
];

console.log("\n🧾 NeuroNourish post-implementation audit");
console.log(`Live base: ${BASE}\n`);

for (const gate of GATES) {
  process.stdout.write(`→ Running ${gate.script}… `);
  const { ok, detail } = runNpm(gate.script);
  console.log(ok ? "PASS" : "FAIL");
  add(gate.id, "Automated gates", gate.name, ok, detail);
}

// Go-live is often partial on ops — capture but do not hard-fail marketing P0 if only ops env gaps
process.stdout.write("→ Running neuronourish:go-live… ");
{
  const result = spawnSync("npm", ["run", "neuronourish:go-live"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0", NN_GO_LIVE_BASE_URL: BASE },
    timeout: 180_000,
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const ok = result.status === 0;
  console.log(ok ? "PASS" : "REVIEW");
  add(
    "G-LIVE",
    "Automated gates",
    "Go-live audit",
    ok,
    ok ? "exit 0" : "See go-live output — often ops/env (Stripe/CNS), not marketing P0",
    false,
  );
  const p0Fails = (out.match(/❌|FAIL|missing/gi) ?? []).length;
  add(
    "G-LIVE-NOTE",
    "Automated gates",
    "Go-live output captured",
    true,
    `${p0Fails} fail-ish tokens in log (informational)`,
    false,
  );
}

// Docs present
const docs = [
  "docs/NEURONOURISH_POST_IMPLEMENTATION.md",
  "docs/NEURONOURISH_SCREAMING_FROG_SEO.md",
  "docs/NEURONOURISH_WEB_DEVELOPMENT.md",
  "docs/NEURONOURISH_CRO.md",
  "docs/NEURONOURISH_BRANDING_DESIGN.md",
  "docs/NEURONOURISH_ANIMATION.md",
  "docs/NeuroNourish_Brand_Guidelines.pdf",
];
for (const d of docs) {
  add(`DOC-${d.split("/").pop()}`, "Documentation", d, existsSync(resolve(ROOT, d)));
}

// Product constraints (static)
const quizData = readFileSync(resolve(ROOT, "src/lib/neuronourish-quiz-data.ts"), "utf8");
const copy = readFileSync(resolve(ROOT, "src/lib/neuronourish-copy.ts"), "utf8");
const shop = readFileSync(resolve(ROOT, "src/lib/neuronourish-shop.ts"), "utf8");
const blogSection = readFileSync(
  resolve(ROOT, "src/components/neuronourish/content/blog-section.tsx"),
  "utf8",
);
const home = readFileSync(resolve(ROOT, "src/components/neuronourish/home-page.tsx"), "utf8");

add(
  "C-END",
  "Constraints",
  "Quiz capture is end-of-quiz gate",
  quizData.includes("NN_QUIZ_CAPTURE_AFTER = NN_QUIZ_QUESTIONS.length"),
);
add(
  "C-FEAR",
  "Constraints",
  "No too late / fear of in copy engine",
  !/\btoo late\b/i.test(copy) && !/\bfear of\b/i.test(copy),
);
add(
  "C-PRICE",
  "Constraints",
  "Shop products keep public price hidden",
  shop.includes("showPublicPrice: false") && !/showPublicPrice:\s*true/.test(shop),
);
add(
  "C-BLOG",
  "Constraints",
  "Blog section CTA not /blog",
  !blogSection.includes('href="/blog"'),
);
add(
  "C-MOTION",
  "Constraints",
  "Home has reveal + sticky + hero motion wiring",
  home.includes("NnScrollReveal") &&
    home.includes("StickyCta") &&
    home.includes("nn-reveal"),
);

// Live HTTP
const LIVE_PATHS = [
  "/",
  "/quiz",
  "/shop",
  "/shop/cognitive-assessment",
  "/discovery",
  "/programme",
  "/team",
  "/contact",
  "/about",
  "/sitemap.xml",
  "/robots.txt",
];

async function live() {
  for (const path of LIVE_PATHS) {
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: path.endsWith(".xml") || path.endsWith(".txt") ? "*/*" : "text/html" },
        redirect: "follow",
      });
      add(`HTTP-${path}`, "Live crawl", `${path} reachable`, res.ok, `status ${res.status}`);
    } catch (err) {
      add(`HTTP-${path}`, "Live crawl", `${path} reachable`, false, String(err));
    }
  }

  try {
    const res = await fetch(`${BASE}/api/health/neuronourish`, {
      headers: { Accept: "application/json" },
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const status = String(json.status ?? json.overall ?? res.status);
    add(
      "HEALTH",
      "Live ops",
      "Health API responds",
      res.ok,
      `HTTP ${res.status} · status=${status}`,
      false,
    );
    const integrations = json.integrations ?? json.checks ?? json;
    add(
      "HEALTH-DETAIL",
      "Live ops",
      "Health payload noted (Stripe/Resend/CNS may be partial)",
      true,
      typeof integrations === "object" ? JSON.stringify(integrations).slice(0, 280) : String(integrations),
      false,
    );
  } catch (err) {
    add("HEALTH", "Live ops", "Health API responds", false, String(err), false);
  }

  try {
    const res = await fetch(BASE, { headers: { Accept: "text/html" } });
    const html = await res.text();
    add(
      "LIVE-HERO",
      "Live crawl",
      "Homepage includes hero / main landmark",
      /nn-hero|main-content/i.test(html),
    );
    add(
      "LIVE-VIEWPORT",
      "Live crawl",
      "Homepage has mobile viewport meta",
      /width=device-width/i.test(html),
    );
  } catch (err) {
    add("LIVE-HERO", "Live crawl", "Homepage HTML checks", false, String(err));
  }
}

async function main() {
  await live();

  const categories = [...new Set(rows.map((r) => r.category))];
  const p0 = rows.filter((r) => r.p0 !== false);
  const p0Pass = p0.filter((r) => r.pass).length;
  const allPass = rows.filter((r) => r.pass).length;

  console.log("\n════════════════════════════════════════");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const r of rows.filter((x) => x.category === cat)) {
      console.log(
        `${r.pass ? "✅" : "❌"} [${r.id}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`,
      );
    }
  }

  const marketingFail = p0.filter((r) => !r.pass);
  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${rows.length}`);
  console.log(
    marketingFail.length === 0
      ? "\nVerdict: PASS (marketing post-implementation P0)\n"
      : `\nVerdict: FAIL — ${marketingFail.length} P0 issue(s)\n`,
  );
  if (marketingFail.length) {
    for (const f of marketingFail) {
      console.log(`  • ${f.id}: ${f.name}${f.detail ? ` (${f.detail})` : ""}`);
    }
    console.log("");
  }
  console.log("Ops/health rows are informational (p0=false) when Stripe/CNS env incomplete.");
  console.log("Full checklist: docs/NEURONOURISH_POST_IMPLEMENTATION.md\n");

  process.exit(marketingFail.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
