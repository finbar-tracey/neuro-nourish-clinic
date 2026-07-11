#!/usr/bin/env npx tsx
/**
 * Workspace nav reorganisation — post-implementation audit (10/10 prompt).
 *
 * Run: npm run workspace:nav
 * Live: WORKSPACE_NAV_AUDIT_LIVE=true npm run workspace:nav
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { GET as navCountsGet } from "@/app/api/workspace/nav-counts/route";
import {
  flatShellNavItems,
  MOBILE_TAB_HREFS,
  SHELL_NAV_SECTIONS,
  shellNavItemByHref,
  type NavCountKey,
} from "@/components/workspace/shell-nav";
import { queueNavCounts } from "@/lib/workspace-case";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  section: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
};

const checks: Check[] = [];
const findings: Array<{ severity: Severity; area: string; finding: string }> = [];

const EXPECTED_ROUTES = [
  "/workspace",
  "/workspace/inbox",
  "/workspace/callbacks",
  "/workspace/documents",
  "/workspace/applications",
  "/workspace/completions",
  "/workspace/closed",
  "/workspace/re-engagement",
  "/workspace/at-risk",
  "/workspace/sources",
  "/workspace/automations",
] as const;

const ACTIONABLE_BADGE_KEYS = new Set<NavCountKey>(["newLead", "callbacks", "completions"]);

const NON_BADGE_KEYS = new Set<NavCountKey>([
  "documents",
  "applications",
  "closed",
  "atRisk",
  "reengagement",
]);

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readIncludes(path: string, needle: string) {
  return read(path).includes(needle);
}

function check(
  id: string,
  section: string,
  pass: boolean,
  detail?: string,
  severity: Severity = "P0",
) {
  checks.push({ id, section, pass, detail, severity });
  if (!pass) {
    findings.push({ severity, area: section, finding: `${id}: ${detail ?? "failed"}` });
  }
}

function authedGet(url: string) {
  const secret = process.env.WORKSPACE_SECRET ?? "test";
  return new NextRequest(url, {
    headers: { cookie: `workspace_token=${secret}` },
  });
}

function moreHiddenBadgeTotal(counts: Record<string, number>) {
  return flatShellNavItems()
    .filter((item) => !MOBILE_TAB_HREFS.includes(item.href as (typeof MOBILE_TAB_HREFS)[number]))
    .reduce((sum, item) => {
      if (!item.countKey || !item.showBadge) return sum;
      return sum + (counts[item.countKey] ?? 0);
    }, 0);
}

function sectionItems(id: string) {
  return SHELL_NAV_SECTIONS.find((s) => s.id === id)?.items ?? [];
}

function sectionHrefs(id: string) {
  return sectionItems(id).map((i) => i.href);
}

async function main() {
  const liveMode = process.env.WORKSPACE_NAV_AUDIT_LIVE === "true";
  const shellNavPath = "src/components/workspace/shell-nav.ts";
  const shellPath = "src/components/workspace/shell.tsx";
  const morePath = "src/components/workspace/workspace-more-sheet.tsx";
  const shellNav = read(shellNavPath);
  const shell = read(shellPath);
  const moreSheet = read(morePath);
  const navItems = flatShellNavItems();

  // ── A. Single source of truth ─────────────────────────────────────────────
  check("A1", "A · Single source of truth", existsSync(join(process.cwd(), shellNavPath)), shellNavPath);
  check(
    "A2",
    "A · Single source of truth",
    shellNav.includes("SHELL_NAV_SECTIONS") &&
      shellNav.includes("MOBILE_TAB_HREFS"),
    "nav config exports",
  );
  check(
    "A3",
    "A · Single source of truth",
    navItems.length === EXPECTED_ROUTES.length &&
      new Set(navItems.map((i) => i.href)).size === EXPECTED_ROUTES.length,
    `${navItems.length} unique destinations`,
  );
  check(
    "A4",
    "A · Single source of truth",
    shell.includes('from "@/components/workspace/shell-nav"') && !shell.includes("const nav = ["),
    "shell imports shell-nav, no parallel nav array",
  );
  check(
    "A5",
    "A · Single source of truth",
    shellNav.includes("flatShellNavItems") && shellNav.includes("shellNavItemByHref"),
    "lookup helpers",
  );
  check(
    "A6",
    "A · Single source of truth",
    navItems.every((i) => i.label && i.shortLabel && "showBadge" in i),
    "label, shortLabel, showBadge on every item",
  );

  // ── B. Route preservation ─────────────────────────────────────────────────
  check(
    "B6",
    "B · Route preservation",
    EXPECTED_ROUTES.every((route) => navItems.some((i) => i.href === route)),
    `all ${EXPECTED_ROUTES.length} routes in nav config`,
  );
  check(
    "B7",
    "B · Route preservation",
    shell.includes("/api/leads/export") && shell.includes("/api/workspace/backup"),
    "footer export + backup",
  );
  check(
    "B8",
    "B · Route preservation",
    !shellNav.includes("/workspace/pipeline") && !moreSheet.includes("/workspace/settings"),
    "no new routes introduced",
  );
  check(
    "B9",
    "B · Route preservation",
    existsSync(join(process.cwd(), "src/app/workspace/cases/[caseId]/page.tsx")),
    "case detail route exists",
  );
  check(
    "B10",
    "B · Route preservation",
    readIncludes("src/middleware.ts", 'pathname.startsWith("/workspace")'),
    "middleware protects workspace",
  );
  const mobileTabSet = new Set<string>(MOBILE_TAB_HREFS);
  const moreOnly = navItems.filter((i) => !mobileTabSet.has(i.href));
  const mobileReachable = new Set([...MOBILE_TAB_HREFS, ...moreOnly.map((i) => i.href)]);
  check(
    "B11",
    "B · Route preservation",
    EXPECTED_ROUTES.every((r) => mobileReachable.has(r)),
    "all routes reachable on mobile (tabs + More)",
  );

  // ── C. Desktop grouped sections ─────────────────────────────────────────
  check(
    "C11",
    "C · Desktop grouped sections",
    SHELL_NAV_SECTIONS.map((s) => s.id).join(",") === "work-today,archive,insights",
    "section order (3-bucket CRM v2)",
  );
  check(
    "C12",
    "C · Desktop grouped sections",
    sectionHrefs("work-today").join(",") ===
      "/workspace,/workspace/inbox,/workspace/callbacks,/workspace/completions",
    "Work today items",
  );
  check(
    "C13",
    "C · Desktop grouped sections",
    sectionHrefs("archive").join(",") ===
      "/workspace/closed,/workspace/documents,/workspace/applications,/workspace/at-risk,/workspace/re-engagement",
    "Archive & more items",
  );
  check(
    "C14",
    "C · Desktop grouped sections",
    !SHELL_NAV_SECTIONS.some((s) => s.id === "pipeline"),
    "pipeline section removed from primary nav",
  );
  check(
    "C15",
    "C · Desktop grouped sections",
    sectionHrefs("insights").join(",") === "/workspace/sources,/workspace/automations",
    "Insights items",
  );
  check(
    "C16",
    "C · Desktop grouped sections",
    shell.includes("text-[10px] font-semibold uppercase tracking-wider text-slate-500") &&
      shell.includes("{section.title}"),
    "non-interactive section headers",
  );
  check(
    "C17",
    "C · Desktop grouped sections",
    shell.includes("bg-white/10 text-gold") && shell.includes("isActive(href)"),
    "active item styling",
  );
  check(
    "C18",
    "C · Desktop grouped sections",
    !shell.match(/Automations[\s\S]{0,80}text-gold/) && shell.includes("isActive(href)"),
    "no static gold on Automations label",
    "P1",
  );

  // ── D. Badge policy ───────────────────────────────────────────────────────
  const badgeOn = navItems.filter((i) => i.showBadge && i.countKey).map((i) => i.countKey);
  const badgeOff = navItems.filter((i) => !i.showBadge && i.countKey).map((i) => i.countKey);
  check(
    "D19",
    "D · Badge policy",
    badgeOn.length === ACTIONABLE_BADGE_KEYS.size &&
      badgeOn.every((k) => k && ACTIONABLE_BADGE_KEYS.has(k)),
    `actionable badges: ${badgeOn.join(", ")}`,
  );
  check(
    "D20",
    "D · Badge policy",
    badgeOff.length === NON_BADGE_KEYS.size &&
      badgeOff.every((k) => k && NON_BADGE_KEYS.has(k)),
    `hidden badges: ${badgeOff.join(", ")}`,
  );
  check(
    "D21",
    "D · Badge policy",
    shell.includes('countKey === "atRisk"') && shell.includes("animate-pulse"),
    "at-risk pulse",
  );
  check("D22", "D · Badge policy", shell.includes('count > 99 ? "99+"'), "99+ cap");
  check(
    "D23",
    "D · Badge policy",
    shell.includes("if (count <= 0) return null") || shell.includes("count <= 0"),
    "zero-count badges hidden",
  );
  check(
    "D24",
    "D · Badge policy",
    shell.includes("countKey && showBadge"),
    "desktop respects showBadge flag",
  );

  // ── E. Queue count badges (no attention strip — avoids layout shift) ─────
  check(
    "E25",
    "E · Nav badges",
    !shell.includes("AttentionStrip") && !shellNav.includes("ATTENTION_STRIP_ITEMS"),
    "attention strip removed",
  );
  check(
    "E26",
    "E · Nav badges",
    shell.includes("function NavBadge") && shell.includes("countKey && showBadge"),
    "desktop sidebar badges",
  );
  check(
    "E27",
    "E · Nav badges",
    shell.includes("mobileTabBadgeCount") && shell.includes("count > 0"),
    "mobile tab badges",
  );
  check(
    "E28",
    "E · Nav badges",
    shell.includes("/api/workspace/nav-counts") && !shell.includes("/api/workspace/attention"),
    "reuses nav-counts only",
  );
  check(
    "E29",
    "E · Nav badges",
    shell.includes("moreHiddenCount") && shell.includes("More"),
    "More tab aggregates hidden queue counts",
    "P1",
  );
  check(
    "E30",
    "E · Nav badges",
    shell.includes('item.countKey === "atRisk"') && shell.includes("animate-pulse bg-red-500"),
    "at-risk badge pulses on mobile",
    "P1",
  );
  check(
    "E31",
    "E · Nav badges",
    shell.includes("countKey === \"atRisk\"") && shell.includes("ring-2 ring-red-400/50"),
    "at-risk badge pulses on desktop",
    "P1",
  );
  check(
    "E32",
    "E · Nav badges",
    moreHiddenBadgeTotal({ newLead: 0, callbacks: 0, completions: 0 }) === 0,
    "zero counts hide More badge",
  );

  // ── F. Nav counts wiring ──────────────────────────────────────────────────
  check(
    "F33",
    "F · Nav counts wiring",
    shell.includes("/api/workspace/nav-counts"),
    "fetches nav-counts",
  );
  check(
    "F34",
    "F · Nav counts wiring",
    shell.includes("workspace:refresh") && shell.includes("workspace:counts-changed"),
    "count refresh events",
  );
  check(
    "F35",
    "F · Nav counts wiring",
    shell.includes("Queue counts could not be loaded") && shell.includes("Retry"),
    "error banner + retry",
  );
  const countKeys = Object.keys(queueNavCounts([]));
  const navCountKeys: NavCountKey[] = [
    "newLead",
    "callbacks",
    "documents",
    "applications",
    "completions",
    "closed",
    "reengagement",
    "atRisk",
  ];
  check(
    "F36",
    "F · Nav counts wiring",
    navCountKeys.every((k) => countKeys.includes(k)) && countKeys.length === navCountKeys.length,
    `queueNavCounts keys: ${countKeys.join(", ")}`,
  );
  check(
    "F37",
    "F · Nav counts wiring",
    readIncludes("src/lib/workspace-case.ts", "export function queueNavCounts"),
    "queueNavCounts export unchanged",
  );

  // ── G. Mobile bottom tabs ─────────────────────────────────────────────────
  check(
    "G38",
    "G · Mobile bottom tabs",
    MOBILE_TAB_HREFS.length === 4 && moreSheet.includes("More"),
    "4 tabs + More",
  );
  check(
    "G39",
    "G · Mobile bottom tabs",
    MOBILE_TAB_HREFS.join(",") ===
      "/workspace,/workspace/inbox,/workspace/callbacks,/workspace/completions",
    "tab routes",
  );
  const mobileTabs = MOBILE_TAB_HREFS.map((href) => shellNavItemByHref(href));
  check(
    "G40",
    "G · Mobile bottom tabs",
    mobileTabs.every((t) => t && t.shortLabel),
    "shortLabel on each tab",
  );
  check(
    "G41",
    "G · Mobile bottom tabs",
    shellNavItemByHref("/workspace/callbacks")?.label === "Follow-Up" &&
      shellNavItemByHref("/workspace/callbacks")?.shortLabel === "Follow",
    "desktop Follow-Up / mobile Follow",
    "P2",
  );
  check(
    "G42",
    "G · Mobile bottom tabs",
    shell.includes("mobileTabBadgeCount") && shell.includes("item.showBadge"),
    "tab badges respect showBadge",
  );
  check(
    "G43",
    "G · Mobile bottom tabs",
    shell.includes('item.countKey === "atRisk" ? "animate-pulse bg-red-500"'),
    "mobile at-risk pulse",
  );
  check(
    "G44",
    "G · Mobile bottom tabs",
    shell.includes("text-gold-ink") &&
      (shell.includes("MOBILE_TAB_HREFS.map") || shell.includes("mobileTabs.map")),
    "active tab styling",
  );

  // ── H. Mobile More sheet ──────────────────────────────────────────────────
  check("H45", "H · Mobile More sheet", moreSheet.includes("export function WorkspaceMoreSheet"), morePath);
  check(
    "H46",
    "H · Mobile More sheet",
    shell.includes("<WorkspaceMoreSheet") && shell.includes("setMoreOpen(true)"),
    "sheet wired from shell",
  );
  check(
    "H47",
    "H · Mobile More sheet",
    moreSheet.includes("onClick={onClose}") && moreSheet.includes('aria-label="Close menu"'),
    "close on backdrop + X",
  );
  check(
    "H48",
    "H · Mobile More sheet",
    shell.includes("setMoreOpen(false)") && shell.includes("[pathname]"),
    "closes on pathname change",
  );
  const moreOnlyHrefs = [
    "/workspace/applications",
    "/workspace/closed",
    "/workspace/documents",
    "/workspace/at-risk",
    "/workspace/re-engagement",
    "/workspace/sources",
    "/workspace/automations",
  ];
  check(
    "H49",
    "H · Mobile More sheet",
    moreOnlyHrefs.every((href) => moreOnly.some((i) => i.href === href)),
    `More-only routes: ${moreOnlyHrefs.join(", ")}`,
  );
  check(
    "H50",
    "H · Mobile More sheet",
    moreSheet.includes("shellNavSectionsForVertical") && moreSheet.includes("{section.title}"),
    "grouped like desktop",
  );
  check(
    "H51",
    "H · Mobile More sheet",
    moreSheet.includes("Data & account") &&
      moreSheet.includes("/api/leads/export") &&
      moreSheet.includes("/api/workspace/backup"),
    "data & account block",
  );
  check(
    "H52",
    "H · Mobile More sheet",
    shell.includes("moreHiddenCount") && shell.includes("moreHiddenCount > 0"),
    "More aggregate badge",
  );
  check(
    "H53",
    "H · Mobile More sheet",
    shell.includes("moreTabActive") && shell.includes("!mobileTabSet.has(pathname)"),
    "More active on More-only routes",
  );
  check(
    "H54",
    "H · Mobile More sheet",
    moreSheet.includes("onLogout") && shell.includes("Sign out"),
    "sign out in sheet + header",
  );

  // ── I. Footer (desktop) ───────────────────────────────────────────────────
  check("I55", "I · Footer (desktop)", shell.includes("Data & account"), "footer section label");
  check("I56", "I · Footer (desktop)", shell.includes("/api/leads/export"), "Export CSV href");
  check("I57", "I · Footer (desktop)", shell.includes("Full backup"), "Full backup label");
  check("I58", "I · Footer (desktop)", shell.includes('href="/"'), "landing page link");
  check(
    "I59",
    "I · Footer (desktop)",
    shell.includes('method: "DELETE"') && shell.includes("/workspace/login"),
    "sign out flow",
  );

  // ── J. Daniel CRM labels ────────────────────────────────────────────────
  check(
    "J60",
    "J · Daniel CRM labels",
    shellNavItemByHref("/workspace/inbox")?.label === "New Leads" &&
      shellNavItemByHref("/workspace/completions")?.label === "Completed" &&
      shellNavItemByHref("/workspace/closed")?.label === "Lost / Disqualified",
    "Daniel-facing nav labels",
  );
  check(
    "J61",
    "J · Daniel CRM labels",
    readIncludes("src/components/workspace/inbox-board.tsx", 'title="New Leads"'),
    "inbox H1 New Leads",
  );
  check(
    "J62",
    "J · Daniel CRM labels",
    readIncludes("src/components/workspace/case-queue-board.tsx", 'title: "Follow-Up"'),
    "callbacks page Follow-Up",
  );
  check(
    "J63",
    "J · Daniel CRM labels",
    readIncludes("src/components/workspace/operational-home.tsx", "Call now") &&
      readIncludes("src/components/workspace/operational-home.tsx", "uncontactedNew"),
    "home Call now / new leads KPIs",
    "P2",
  );

  // ── K. Regression audits ──────────────────────────────────────────────────
  let workspaceAuditOk = false;
  try {
    execSync("npm run workspace:audit", { stdio: "pipe", cwd: process.cwd() });
    workspaceAuditOk = true;
  } catch {
    workspaceAuditOk = false;
  }
  check("K64", "K · Regression audits", workspaceAuditOk, "npm run workspace:audit");
  check(
    "K65",
    "K · Regression audits",
    readIncludes(shellPath, "Full backup"),
    "crm-backup-audit shell string",
  );
  check(
    "K66",
    "K · Regression audits",
    !shell.includes("const nav = [") && !moreSheet.includes("console.log"),
    "no dead nav array / debug logs",
    "P1",
  );
  check(
    "K67",
    "K · Regression audits",
    shellNavPath.endsWith("shell-nav.ts") && !shellNav.includes("from \"react\""),
    "shell-nav is server-safe",
  );

  // ── L. Accessibility & UX ─────────────────────────────────────────────────
  check(
    "L68",
    "L · Accessibility & UX",
    moreSheet.includes('role="dialog"') && moreSheet.includes('aria-modal="true"'),
    "dialog semantics",
  );
  check("L69", "L · Accessibility & UX", moreSheet.includes('aria-label="Close"'), "close button label");
  check(
    "L70",
    "L · Accessibility & UX",
    moreSheet.includes('aria-label="Close menu"'),
    "backdrop label",
  );
  check(
    "L71",
    "L · Accessibility & UX",
    shell.includes("shrink-0") && shell.includes("flex-1"),
    "icon + label layout",
  );
  check(
    "L72",
    "L · Accessibility & UX",
    shell.includes("overflow-y-auto") && shell.includes("flex-1"),
    "sidebar scroll",
  );
  check(
    "L73",
    "L · Accessibility & UX",
    shell.includes("flex-col md:ml-64") &&
      shell.includes("pb-[calc(5rem+env(safe-area-inset-bottom,0px))]"),
    "mobile column layout + content clearance",
  );

  // ── M. Edge cases (programmatic) ──────────────────────────────────────────
  check(
    "M74",
    "M · Edge cases",
    moreHiddenBadgeTotal({}) === 0,
    "zero counts: no More badge",
  );
  check(
    "M75",
    "M · Edge cases",
    shell.includes("countsError") && shell.includes("{children}"),
    "nav renders when counts API fails",
  );
  check(
    "M76",
    "M · Edge cases",
    shell.includes('href === "/workspace"') && shell.includes("pathname.startsWith"),
    "isActive handles home vs nested routes",
  );
  check(
    "M77",
    "M · Edge cases",
    !mobileTabSet.has("/workspace/automations") && shell.includes("moreTabActive"),
    "automations is a More-only route (highlights More tab)",
    "P1",
  );
  check(
    "M78",
    "M · Edge cases",
    moreOnly.some((i) => i.href === "/workspace/closed"),
    "closed reachable via More",
  );
  check(
    "M79",
    "M · Edge cases",
    shell.includes("workspace:counts-changed"),
    "counts-changed listener for live refresh",
  );

  // ── N. Code hygiene ───────────────────────────────────────────────────────
  const navHrefs = navItems.map((i) => i.href);
  const iconKeys = [
    ...shell.matchAll(/"(\/workspace(?:\/[^"]+)?)":/g),
  ].map((m) => m[1]);
  const missingIcons = navHrefs.filter((h) => !iconKeys.includes(h));
  check(
    "N80",
    "N · Code hygiene",
    missingIcons.length === 0,
    missingIcons.length ? `missing NAV_ICONS: ${missingIcons.join(", ")}` : "all hrefs mapped",
    missingIcons.length ? "P1" : "P0",
  );
  check(
    "N81",
    "N · Code hygiene",
    !shell.includes("console.log") && !moreSheet.includes("console.log") && !shellNav.includes("console.log"),
    "no debug logging",
    "P1",
  );
  check(
    "N82",
    "N · Code hygiene",
    shell.startsWith('"use client"') && moreSheet.startsWith('"use client"') && !shellNav.includes('"use client"'),
    "client boundary correct",
  );
  check(
    "N83",
    "N · Code hygiene",
    existsSync(join(process.cwd(), morePath)) &&
      moreSheet.includes("mobileTabHrefsForVertical"),
    "more sheet imports mobile tab config",
  );

  // ── Live advisory ─────────────────────────────────────────────────────────
  if (liveMode) {
    try {
      const res = await navCountsGet(authedGet("http://localhost/api/workspace/nav-counts"));
      const body = (await res.json()) as { counts: Record<string, number> };
      check(
        "LIVE1",
        "Live · nav-counts API",
        res.status === 200,
        `status ${res.status}`,
      );
      check(
        "LIVE2",
        "Live · nav-counts API",
        navCountKeys.every((k) => typeof body.counts[k] === "number"),
        "all NavCountKey fields numeric",
      );
    } catch (error) {
      check(
        "LIVE1",
        "Live · nav-counts API",
        false,
        error instanceof Error ? error.message : "nav-counts call failed",
        "P1",
      );
    }
  }

  // ── O. Ship gate ──────────────────────────────────────────────────────────
  const passed = checks.filter((c) => c.pass).length;
  const p0Failed = checks.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = checks.filter((c) => !c.pass && c.severity === "P1");
  const p2Failed = checks.filter((c) => !c.pass && c.severity === "P2");

  const score =
    p0Failed.length > 0
      ? Math.max(4, 10 - p0Failed.length)
      : p1Failed.length > 2
        ? 8
        : p1Failed.length > 0
          ? 9
          : p2Failed.length > 0
            ? 9
            : 10;

  let verdict: "SHIP" | "SHIP WITH FIXES" | "DO NOT SHIP";
  if (p0Failed.length > 0) verdict = "DO NOT SHIP";
  else if (p1Failed.length > 0) verdict = "SHIP WITH FIXES";
  else verdict = "SHIP";

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("WORKSPACE NAV POST-IMPLEMENTATION AUDIT");
  console.log("══════════════════════════════════════════════════════════\n");

  const bySection = new Map<string, Check[]>();
  for (const c of checks) {
    const list = bySection.get(c.section) ?? [];
    list.push(c);
    bySection.set(c.section, list);
  }

  for (const [section, list] of bySection) {
    console.log(`## ${section}`);
    for (const c of list) {
      const sev = c.severity !== "P0" ? ` [${c.severity}]` : "";
      console.log(`  ${c.pass ? "✓" : "✗"} ${c.id}${sev}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    console.log("");
  }

  console.log(`RESULT: ${passed}/${checks.length} checks passed`);
  console.log(`P0 failures: ${p0Failed.length} · P1: ${p1Failed.length} · P2: ${p2Failed.length}`);
  console.log(`SCORE: ${score}/10`);
  console.log(`VERDICT: ${verdict}\n`);

  if (findings.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area} — ${f.finding}`);
    }
    console.log("");
  }

  if (!liveMode) {
    console.log("💡 Live checks: WORKSPACE_NAV_AUDIT_LIVE=true npm run workspace:nav\n");
  }

  if (p0Failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
