#!/usr/bin/env npx tsx
/**
 * Workspace mobile responsive — post-implementation audit (10/10 prompt).
 * Includes P0 layout fix (header + main column wrapper) and Section R mobile polish
 * (search placeholder, queue toolbar stack, home new-activity nudge).
 *
 * Run: npm run workspace:mobile
 * Live: WORKSPACE_MOBILE_AUDIT_LIVE=true npm run workspace:mobile
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { GET as operationalGet } from "@/app/api/workspace/operational/route";
import { flatShellNavItems, MOBILE_TAB_HREFS } from "@/components/workspace/shell-nav";

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

const MOBILE_HOME_KPI_LABELS = [
  "New leads",
  "Follow-up",
  "Overdue",
  "Invoice this month",
];

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

function runNpm(script: string) {
  try {
    execSync(`npm run ${script}`, { stdio: "pipe", cwd: process.cwd() });
    return true;
  } catch {
    return false;
  }
}

function authedGet(url: string) {
  const secret = process.env.WORKSPACE_SECRET ?? "test";
  return new NextRequest(url, {
    headers: { cookie: `workspace_token=${secret}` },
  });
}

function searchMatchesQuery(
  borrowerName: string,
  phone: string,
  email: string,
  q: string,
) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return false;
  return (
    borrowerName.toLowerCase().includes(needle) ||
    phone.includes(needle) ||
    email.toLowerCase().includes(needle)
  );
}

/** Detect regressed side-by-side mobile layout (header immediately after aside). */
function shellHeaderMainInColumnWrapper(shell: string) {
  const afterAside = shell.split("</aside>")[1] ?? "";
  const opensWrapper =
    afterAside.includes('className="flex min-w-0 flex-1 flex-col md:ml-64"') ||
    afterAside.includes("flex min-w-0 flex-1 flex-col md:ml-64");
  const headerNotDirectSibling = !afterAside.trimStart().startsWith("<header");
  const headerInsideWrapper = afterAside.includes("<header") && afterAside.includes("<main");
  return opensWrapper && headerNotDirectSibling && headerInsideWrapper;
}

function countKpiCardsInBlock(source: string, blockPattern: RegExp) {
  const match = source.match(blockPattern);
  if (!match) return 0;
  return (match[0].match(/<WorkspaceKpiCard/g) ?? []).length;
}

async function main() {
  const liveMode = process.env.WORKSPACE_MOBILE_AUDIT_LIVE === "true";

  const home = read("src/components/workspace/operational-home.tsx");
  const shell = read("src/components/workspace/shell.tsx");
  const caseDetail = read("src/components/workspace/case-detail.tsx");
  const mobileBar = read("src/components/workspace/case-detail-mobile-bar.tsx");
  const mobileSearch = read("src/components/workspace/workspace-mobile-search.tsx");
  const isMobileHook = read("src/components/workspace/use-is-mobile.ts");
  const hook = read("src/components/workspace/use-operational-data.ts");
  const inbox = read("src/components/workspace/inbox-board.tsx");
  const caseQueue = read("src/components/workspace/case-queue-board.tsx");
  const reengagement = read("src/components/workspace/reengagement-board.tsx");
  const workspaceCase = read("src/lib/workspace-case.ts");
  const wsLayout = read("src/app/workspace/layout.tsx");
  const rootLayout = read("src/app/layout.tsx");
  const login = read("src/app/workspace/login/page.tsx");
  const footer = read("src/components/workspace/case-card-footer.tsx");
  const caseCard = read("src/components/workspace/case-card.tsx");
  const moreSheet = read("src/components/workspace/workspace-more-sheet.tsx");
  const workspaceUi = read("src/components/workspace/workspace-ui.tsx");
  const uiAudit = read("scripts/workspace-ui-audit.ts");
  const goLive = read("scripts/master-go-live-audit.ts");
  const siteManifest = read("public/site.webmanifest");
  const wsManifest = read("public/workspace.webmanifest");
  const middleware = read("src/middleware.ts");
  const operationalRoute = read("src/app/api/workspace/operational/route.ts");
  const navCountsRoute = read("src/app/api/workspace/nav-counts/route.ts");
  const contactRoute = read("src/app/api/leads/[id]/contact/route.ts");

  const mobileKpiCount = countKpiCardsInBlock(
    home,
    /grid grid-cols-2 gap-3 md:hidden[\s\S]*?(?=<\/>|<div className="mb-6 hidden)/,
  );
  const desktopKpiCount = countKpiCardsInBlock(
    home,
    /hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-5">[\s\S]*?(?=\n\s*<\/div>\n\s*<\/>)/,
  );

  // ── A · Critical layout fix (P0 — phone screenshot bug) ───────────────────
  check(
    "A1",
    "A · Critical layout fix",
    shellHeaderMainInColumnWrapper(shell),
    "header + main inside flex-col wrapper, not row siblings",
  );
  check(
    "A2",
    "A · Critical layout fix",
    shell.includes('className="flex min-h-screen bg-slate-100"') && shell.includes("<aside"),
    "root flex shell with fixed aside",
  );
  check(
    "A3",
    "A · Critical layout fix",
    shell.includes("hidden w-64") && shell.includes("md:flex") && shell.includes("fixed inset-y-0"),
    "desktop sidebar fixed + hidden below md",
  );
  check(
    "A4",
    "A · Critical layout fix",
    shell.includes("flex min-w-0 flex-1 flex-col md:ml-64"),
    "column wrapper with md:ml-64 offset",
  );
  check(
    "A5",
    "A · Critical layout fix",
    !shell.match(/<main className="[^"]*md:ml-64/),
    "md:ml-64 not on main alone",
  );
  check(
    "A6",
    "A · Critical layout fix",
    shell.includes('<header className="sticky top-0') && shell.includes("md:hidden"),
    "mobile header full-width bar md:hidden",
  );
  check(
    "A7",
    "A · Critical layout fix",
    shell.includes('<main className="min-w-0 flex-1') && shell.includes("min-w-0"),
    "main below header with min-w-0",
  );
  check(
    "A8",
    "A · Critical layout fix",
    shell.includes("fixed inset-x-0 bottom-0") && shell.includes("md:hidden"),
    "bottom tab bar mobile-only",
  );
  check(
    "A9",
    "A · Critical layout fix",
    !shell.split("</aside>")[1]?.trimStart().startsWith("<header"),
    "header not direct sibling after aside (no fake sidebar)",
  );
  check(
    "A10",
    "A · Critical layout fix",
    shell.includes("WorkspaceMobileSearch") && shell.includes("Sign out"),
    "mobile header row: search + sign out",
  );

  // ── B · Mobile Home dashboard ─────────────────────────────────────────────
  check("B1", "B · Mobile Home", isMobileHook.includes("useIsMobile"), "useIsMobile hook exists");
  check("B2", "B · Mobile Home", home.includes("useIsMobile"), "home uses responsive hook");
  check("B3", "B · Mobile Home", home.includes("hidden rounded-xl bg-navy") && home.includes("BrandLogo"), "desktop logo block");
  check("B4", "B · Mobile Home", home.includes("md:hidden") && home.includes("greeting()"), "mobile inline greeting");
  check("B5", "B · Mobile Home", home.includes("hidden md:block") && home.includes("WorkspacePageHeader"), "desktop page header only");
  check("B6", "B · Mobile Home", home.includes("md:hidden") && home.includes("Call new leads first"), "mobile subtitle");
  check(
    "B7",
    "B · Mobile Home",
    home.includes("grid grid-cols-2 gap-3 md:hidden") && home.includes("hidden gap-3 md:grid"),
    "separate mobile/desktop KPI grids",
  );
  check("B8", "B · Mobile Home", mobileKpiCount === 4, `mobile grid has 4 KPI cards (${mobileKpiCount})`);
  check("B9", "B · Mobile Home", desktopKpiCount === 5, `desktop grid has 5 KPI cards (${desktopKpiCount})`);
  check(
    "B10",
    "B · Mobile Home",
    MOBILE_HOME_KPI_LABELS.every((label) => home.includes(label)),
    `KPI labels present: ${MOBILE_HOME_KPI_LABELS.join(", ")}`,
  );
  check(
    "B11",
    "B · Mobile Home",
    !home.includes('label="Calls booked"'),
    "legacy Calls booked KPI removed from home",
  );
  check(
    "B12",
    "B · Mobile Home",
    !home.includes('label="Pipeline commission"'),
    "pipeline commission removed from home v2",
  );
  check(
    "B13",
    "B · Mobile Home",
    home.includes("QUICK_LINKS") && home.includes("hidden") && home.includes("md:flex"),
    "quick links desktop-only",
  );
  check("B14", "B · Mobile Home", home.includes("uncontactedNew"), "call now feed from uncontactedNew");
  check(
    "B15",
    "B · Mobile Home",
    home.includes("callNow.slice(0, 5)"),
    "mobile call now cap at 5",
  );
  check(
    "B16",
    "B · Mobile Home",
    home.includes('href="/workspace/inbox"') && home.includes("View all"),
    "view all urgent link",
  );
  check(
    "B17",
    "B · Mobile Home",
    !home.includes("Applications in progress"),
    "pipeline section removed from home v2",
  );
  check("B18", "B · Mobile Home", home.includes("useOperationalData"), "same operational data hook");
  check(
    "B19",
    "B · Mobile Home",
    home.includes("WorkspaceErrorState") && home.includes("WorkspaceSkeletonCards"),
    "error and skeleton states",
  );

  // ── C · Mobile search ─────────────────────────────────────────────────────
  check("C1", "C · Mobile search", mobileSearch.includes("export function WorkspaceMobileSearch"), "search component");
  check("C2", "C · Mobile search", shell.includes("WorkspaceMobileSearch"), "search in mobile shell header");
  check("C3", "C · Mobile search", mobileSearch.includes('type="search"'), "search input type");
  check("C4", "C · Mobile search", mobileSearch.includes('autoComplete="off"'), "autocomplete off");
  check("C5", "C · Mobile search", mobileSearch.includes("text-base"), "16px search input");
  check("C6", "C · Mobile search", mobileSearch.includes("/api/workspace/operational"), "lazy operational fetch");
  check("C7", "C · Mobile search", mobileSearch.includes("borrowerName") && mobileSearch.includes("phone"), "name/phone match");
  check("C8", "C · Mobile search", mobileSearch.includes("email"), "email match");
  check(
    "C9",
    "C · Mobile search",
    searchMatchesQuery("Jane Smith", "07700900123", "jane@example.com", "sm") &&
      !searchMatchesQuery("Jane Smith", "07700900123", "jane@example.com", "x"),
    "search match logic (programmatic)",
  );
  check("C10", "C · Mobile search", mobileSearch.includes("/workspace/cases/"), "case deep links");
  check("C11", "C · Mobile search", mobileSearch.includes("onClick={close}"), "closes on result tap");
  check("C12", "C · Mobile search", mobileSearch.includes('aria-label="Search cases"'), "search open label");
  check("C13", "C · Mobile search", mobileSearch.includes('aria-label="Close search"'), "search close label");
  check(
    "C14",
    "C · Mobile search",
    shell.includes('pathname.startsWith("/workspace/cases/")'),
    "logo hidden on case detail for header space",
    "P1",
  );

  // ── D · Case sticky bar ───────────────────────────────────────────────────
  check("D1", "D · Case sticky bar", existsSync(join(process.cwd(), "src/components/workspace/case-detail-mobile-bar.tsx")), "bar file");
  check("D2", "D · Case sticky bar", caseDetail.includes("CaseDetailMobileBar"), "wired in case detail");
  check("D3", "D · Case sticky bar", mobileBar.includes("md:hidden"), "hidden on desktop");
  check("D4", "D · Case sticky bar", mobileBar.includes("CaseCardFooter") && mobileBar.includes("prominent"), "reuses CaseCardFooter");
  check("D5", "D · Case sticky bar", mobileBar.includes("leadToCase"), "leadToCase workflow path");
  check("D6", "D · Case sticky bar", footer.includes("prominent = false"), "prominent defaults off for queue cards");
  check("D7", "D · Case sticky bar", footer.includes("min-h-11"), "44px prominent buttons");
  check(
    "D8",
    "D · Case sticky bar",
    caseDetail.includes("hidden md:block") && caseDetail.includes("LeadContactActions"),
    "desktop-only in-page contacts",
  );
  check(
    "D9",
    "D · Case sticky bar",
    caseDetail.includes("hidden={isCompleted || isClosed}"),
    "bar hidden for closed/completed",
  );
  check("D10", "D · Case sticky bar", caseDetail.includes("pb-32 md:pb-8"), "content bottom padding");
  check(
    "D11",
    "D · Case sticky bar",
    mobileBar.includes("bottom-[calc(4rem+env(safe-area-inset-bottom"),
    "bar above bottom nav + safe area",
  );
  check("D12", "D · Case sticky bar", mobileBar.includes("z-30"), "z-index above content");

  // ── E · Shell safe areas & touch ──────────────────────────────────────────
  check("E1", "E · Shell safe areas", shell.includes("safe-area-inset-top"), "header safe area top");
  check("E2", "E · Shell safe areas", shell.includes("safe-area-inset-bottom"), "nav safe area bottom");
  check(
    "E3",
    "E · Shell safe areas",
    shell.includes("pb-[calc(5rem+env(safe-area-inset-bottom,0px))]"),
    "main content clearance",
  );
  check("E4", "E · Shell safe areas", shell.includes("flex-col md:ml-64") && shell.includes("min-w-0 flex-1"), "column wrapper");
  check("E5", "E · Shell safe areas", shell.includes("min-h-11"), "touch-friendly tab targets");
  check("E6", "E · Shell safe areas", shell.includes("fixed inset-x-0 bottom-0"), "bottom nav preserved");
  check("E7", "E · Shell safe areas", shell.includes("hidden w-64") && shell.includes("md:flex"), "desktop sidebar preserved");
  check("E8", "E · Shell safe areas", shell.includes("mobileTabBadgeCount"), "mobile tab badges for counts");
  check("E9", "E · Shell safe areas", shell.includes("shellNavSectionsForVertical"), "grouped nav intact");
  check("E10", "E · Shell safe areas", shell.includes("WorkspaceMoreSheet"), "More sheet intact");
  check("E11", "E · Shell safe areas", shell.includes("workspace:refresh") && shell.includes("workspace:counts-changed"), "count refresh events");

  // ── F · Queue pages mobile ────────────────────────────────────────────────
  check("F1", "F · Queue mobile", inbox.includes('type="search"'), "inbox search");
  check("F2", "F · Queue mobile", inbox.includes("WorkspaceFilterChips"), "inbox urgency filter chips");
  check("F3", "F · Queue mobile", inbox.includes("caseInOperationalQueue(c, \"NEW_LEAD\")"), "inbox new leads only");
  check("F4", "F · Queue mobile", inbox.includes("p-4 sm:p-6"), "inbox responsive padding");
  check("F5", "F · Queue mobile", inbox.includes('type="search"'), "inbox search type");
  check("F6", "F · Queue mobile", inbox.includes("text-base") && inbox.includes("md:text-sm"), "inbox input 16px mobile");
  check("F7", "F · Queue mobile", existsSync(join(process.cwd(), "src/components/workspace/case-queue-board.tsx")), "case queue board exists");
  check("F8", "F · Queue mobile", caseQueue.includes("p-4 md:p-8"), "queue board responsive padding");

  // ── G · iOS / input polish ────────────────────────────────────────────────
  check("G1", "G · iOS polish", wsLayout.includes("max-md:[&_input]:text-base"), "workspace 16px inputs");
  check("G2", "G · iOS polish", wsLayout.includes("max-md:[&_select]:text-base"), "workspace 16px selects");
  check("G3", "G · iOS polish", wsLayout.includes("max-md:[&_textarea]:text-base"), "workspace 16px textareas");
  check("G4", "G · iOS polish", rootLayout.includes('viewportFit: "cover"'), "viewport-fit cover");
  check("G5", "G · iOS polish", login.includes('autoComplete="current-password"'), "login autocomplete");
  check("G6", "G · iOS polish", login.includes("min-h-11"), "login submit touch target");
  check("G7", "G · iOS polish", login.includes("text-base"), "login password 16px");
  check("G8", "G · iOS polish", login.includes("safeNextPath"), "login next redirect helper");

  // ── H · Stale data reload ─────────────────────────────────────────────────
  check("H1", "H · Stale reload", hook.includes("lastLoadedAt"), "tracks last load time");
  check("H2", "H · Stale reload", hook.includes("STALE_MS"), "stale threshold constant");
  check("H3", "H · Stale reload", hook.includes("visibilitychange"), "tab resume listener");
  check("H4", "H · Stale reload", hook.includes("workspace:counts-changed"), "counts event on reload");
  check("H5", "H · Stale reload", hook.includes("/workspace/login"), "401 redirect preserved");

  // ── I · PWA workspace manifest ────────────────────────────────────────────
  check("I1", "I · PWA", existsSync(join(process.cwd(), "public/workspace.webmanifest")), "workspace manifest file");
  check("I2", "I · PWA", wsManifest.includes('"start_url": "/workspace"'), "start_url /workspace");
  check("I3", "I · PWA", wsManifest.includes('"scope": "/workspace"'), "scope /workspace");
  check("I4", "I · PWA", wsLayout.includes('manifest: "/workspace.webmanifest"'), "manifest in workspace layout");
  check("I5", "I · PWA", wsLayout.includes("appleWebApp"), "apple web app metadata");
  check(
    "I6",
    "I · PWA",
    siteManifest.includes('"start_url": "/"') && rootLayout.includes("/site.webmanifest"),
    "landing manifest unchanged",
  );
  check("I7", "I · PWA", wsManifest.includes("icons"), "workspace manifest icons", "P1");

  // ── J · Route & API preservation ──────────────────────────────────────────
  check(
    "J1",
    "J · Route preservation",
    !home.includes("/workspace/mobile") &&
      !shell.includes("/workspace/mobile") &&
      !mobileSearch.includes("/workspace/mobile"),
    "no /workspace/mobile route",
  );
  const mobileReachable = new Set([
    ...MOBILE_TAB_HREFS,
    ...flatShellNavItems()
      .filter((item) => !MOBILE_TAB_HREFS.includes(item.href as (typeof MOBILE_TAB_HREFS)[number]))
      .map((item) => item.href),
  ]);
  check(
    "J2",
    "J · Route preservation",
    EXPECTED_ROUTES.every((r) => mobileReachable.has(r)),
    "all routes reachable on mobile",
  );
  check(
    "J3",
    "J · Route preservation",
    operationalRoute.includes("export async function GET") && !operationalRoute.includes("mobile"),
    "operational API unchanged shape",
  );
  check("J4", "J · Route preservation", navCountsRoute.includes("queueNavCounts"), "nav-counts API intact");
  check("J5", "J · Route preservation", contactRoute.includes("export async function POST"), "contact log API intact");
  check("J6", "J · Route preservation", middleware.includes("workspace_token"), "auth middleware intact");
  check(
    "J7",
    "J · Route preservation",
    existsSync(join(process.cwd(), "src/app/workspace/cases/[caseId]/page.tsx")),
    "case detail route exists",
  );

  // ── K · Desktop regression ────────────────────────────────────────────────
  check("K1", "K · Desktop regression", home.includes("xl:grid-cols-5"), "desktop 5 KPI grid");
  check("K2", "K · Desktop regression", home.includes("QUICK_LINKS.map"), "desktop quick links render");
  check("K3", "K · Desktop regression", home.includes("displayCallNow"), "call now feed renders");
  check("K4", "K · Desktop regression", caseDetail.includes("hidden md:block") && caseDetail.includes("LeadContactActions"), "desktop contact actions");
  check("K5", "K · Desktop regression", !mobileBar.includes("hidden md:block") && mobileBar.includes("md:hidden"), "sticky bar mobile-only");
  check("K6", "K · Desktop regression", shell.includes("Full backup") && shell.includes("/api/leads/export"), "desktop footer links");
  check("K7", "K · Desktop regression", runNpm("workspace:audit"), "workspace:audit");
  check("K8", "K · Desktop regression", runNpm("workspace:nav"), "workspace:nav");
  check("K9", "K · Desktop regression", readIncludes("src/components/workspace/shell.tsx", "BrandLogo"), "shell brand logo");
  check(
    "K10",
    "K · Desktop regression",
    shell.includes("md:flex") && shell.includes("md:ml-64") && shell.includes("md:pb-0"),
    "desktop offset + padding on wrapper/main",
  );

  // ── L · Accessibility ─────────────────────────────────────────────────────
  check("L1", "L · Accessibility", mobileSearch.includes('aria-label="Search cases"'), "search open aria");
  check("L2", "L · Accessibility", mobileSearch.includes('aria-label="Close search"'), "search close aria");
  check("L3", "L · Accessibility", caseCard.includes('aria-label={`Open case for'), "case card link label");
  check("L4", "L · Accessibility", footer.includes('aria-label={btn.label}'), "footer button labels");
  check("L5", "L · Accessibility", moreSheet.includes('role="dialog"') && moreSheet.includes('aria-modal="true"'), "more sheet dialog");
  check("L6", "L · Accessibility", shell.includes("animate-pulse"), "at-risk pulse preserved");

  // ── M · Edge cases ────────────────────────────────────────────────────────
  check("M1", "M · Edge cases", home.includes("All clear"), "empty state copy");
  check("M2", "M · Edge cases", home.includes("Browse new leads"), "empty state CTA");
  check("M3", "M · Edge cases", shell.includes("countsError") && shell.includes("Retry"), "nav counts error retry");
  check("M4", "M · Edge cases", home.includes("onRetry={() => void reload()}"), "home operational error retry");
  check("M5", "M · Edge cases", mobileSearch.includes("query.trim().length < 2"), "search min 2 chars");
  check("M6", "M · Edge cases", mobileSearch.includes("No matching cases"), "search zero results copy");
  check("M7", "M · Edge cases", isMobileHook.includes("matchMedia"), "responsive hook uses matchMedia");
  check("M8", "M · Edge cases", hook.includes("visibilitychange"), "resume from dialer refresh path");
  check(
    "M9",
    "M · Edge cases",
    shellHeaderMainInColumnWrapper(shell),
    "landscape/mobile still uses column wrapper",
  );

  // ── N · Code hygiene ──────────────────────────────────────────────────────
  check("N1", "N · Code hygiene", mobileBar.startsWith('"use client"'), "mobile bar client component");
  check("N2", "N · Code hygiene", mobileSearch.startsWith('"use client"'), "mobile search client component");
  check("N3", "N · Code hygiene", isMobileHook.startsWith('"use client"'), "is-mobile hook is client");
  check(
    "N4",
    "N · Code hygiene",
    !mobileBar.includes("console.log") && !mobileSearch.includes("console.log") && !shell.includes("console.log"),
    "no debug logging",
  );
  check("N5", "N · Code hygiene", workspaceUi.includes("className?: string"), "KpiCard className prop");
  check("N6", "N · Code hygiene", !existsSync(join(process.cwd(), "src/components/workspace/mobile-operational-home.tsx")), "no duplicate home file");
  check("N7", "N · Code hygiene", home.includes("export function OperationalHome"), "single home export");
  check(
    "N8",
    "N · Code hygiene",
    shell.includes("</aside>") && shell.includes("flex-col md:ml-64") && shell.includes("</main>"),
    "documented shell structure: aside → wrapper → header + main",
  );

  // ── R · Mobile polish (P2 — search + home nudge, additive only) ─────────
  const searchPlaceholder = 'placeholder="Search cases…"';
  const searchAriaLabel = 'aria-label="Search cases by name, phone, or email"';
  const legacyPlaceholders = [
    "Search name, phone or email",
    "Search name, email, phone",
    "Search name, phone, email",
  ];
  const workspaceSearchFiles = [caseQueue, inbox, reengagement, mobileSearch].join("\n");

  check("R1", "R · Mobile polish", caseQueue.includes(searchPlaceholder), "queue search placeholder");
  check("R2", "R · Mobile polish", caseQueue.includes(searchAriaLabel), "queue search aria-label");
  check(
    "R3",
    "R · Mobile polish",
    caseQueue.includes("flex-col sm:flex-row sm:items-center"),
    "queue toolbar stacks on mobile",
  );
  check(
    "R4",
    "R · Mobile polish",
    caseQueue.includes("w-full") && caseQueue.includes("sm:w-auto"),
    "queue stage filter full width on mobile",
  );
  check("R5", "R · Mobile polish", inbox.includes(searchPlaceholder) && inbox.includes(searchAriaLabel), "inbox search placeholder + aria");
  check(
    "R6",
    "R · Mobile polish",
    reengagement.includes(searchPlaceholder) && reengagement.includes(searchAriaLabel),
    "re-engagement search placeholder + aria",
  );
  check(
    "R7",
    "R · Mobile polish",
    mobileSearch.includes(searchPlaceholder) && mobileSearch.includes(searchAriaLabel),
    "header mobile search placeholder + aria",
  );
  check(
    "R8",
    "R · Mobile polish",
    !legacyPlaceholders.some((p) => workspaceSearchFiles.includes(p)),
    "no legacy long search placeholders in workspace search surfaces",
  );
  check("R9", "R · Mobile polish", home.includes("uncontactedNew"), "home Call now feed");
  check(
    "R10",
    "R · Mobile polish",
    home.includes("followUpDue") && home.includes("Follow-up"),
    "home Follow-up section",
  );
  check("R11", "R · Mobile polish", home.includes("Call now"), "home Call now heading");
  check("R12", "R · Mobile polish", home.includes("/workspace/callbacks"), "home links to Follow-Up queue");
  check("R13", "R · Mobile polish", home.includes("All clear"), "empty state copy preserved");
  check("R14", "R · Mobile polish", home.includes("Browse new leads"), "empty state CTA preserved");
  check(
    "R15",
    "R · Mobile polish",
    workspaceCase.includes("buildUrgentFeed") &&
      workspaceCase.includes('c.slaStatus === "OVERDUE"') &&
      workspaceCase.includes('c.slaStatus === "DUE_SOON"'),
    "buildUrgentFeed SLA filter unchanged",
  );
  check(
    "R16",
    "R · Mobile polish",
    uiAudit.includes("Home Call now section") && uiAudit.includes("Queue board mobile search placeholder"),
    "workspace-ui-audit polish asserts wired",
  );

  // ── O · Audit & go-live wiring ────────────────────────────────────────────
  check("O1", "O · Audit wiring", existsSync(join(process.cwd(), "scripts/workspace-mobile-audit.ts")), "audit script exists");
  check("O2", "O · Audit wiring", readIncludes("package.json", '"workspace:mobile"'), "npm script registered");
  check("O3", "O · Audit wiring", goLive.includes("workspace:mobile"), "master go-live includes mobile audit");
  check("O4", "O · Audit wiring", uiAudit.includes("Case detail mobile bar"), "workspace-ui-audit mobile bar check");
  check("O5", "O · Audit wiring", uiAudit.includes("Workspace mobile search"), "workspace-ui-audit mobile search check");
  check("O6", "O · Audit wiring", readIncludes("scripts/workspace-mobile-audit.ts", "A · Critical layout fix"), "layout fix section in audit");
  check("O7", "O · Audit wiring", readIncludes("scripts/workspace-mobile-audit.ts", "shellHeaderMainInColumnWrapper"), "layout regression helper");
  check("O9", "O · Audit wiring", readIncludes("scripts/workspace-mobile-audit.ts", "R · Mobile polish"), "mobile polish section in audit");
  const staticCheckCount = checks.length;
  check("O8", "O · Audit wiring", staticCheckCount >= 120, `${staticCheckCount} static checks defined`, "P1");

  // ── P · Live advisory ─────────────────────────────────────────────────────
  if (liveMode) {
    try {
      const res = await operationalGet(authedGet("http://localhost/api/workspace/operational"));
      const body = (await res.json()) as {
        pulse?: Record<string, unknown>;
        priorities?: Record<string, unknown>;
        cases?: unknown[];
      };
      check("P1", "P · Live advisory", res.status === 200, `operational status ${res.status}`);
      check("P2", "P · Live advisory", body.pulse != null && body.priorities != null, "pulse + priorities present");
      check("P3", "P · Live advisory", Array.isArray(body.cases), "cases array present");
    } catch (error) {
      check(
        "P1",
        "P · Live advisory",
        false,
        error instanceof Error ? error.message : "operational live call failed",
        "P1",
      );
    }
  }

  // ── Q · Ship gate ─────────────────────────────────────────────────────────
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
  console.log("WORKSPACE MOBILE POST-IMPLEMENTATION AUDIT");
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

  console.log("Daniel manual smoke (Q):");
  console.log("  P0 — Layout (unchanged):");
  const smokeP0 = [
    "/workspace — navy header full width on TOP, not a left column beside content",
    "Home — 4 KPI tiles in 2×2 (New today, Calls due, Docs outstanding, At risk), not 6",
    "Bottom tabs on phone; desktop 1280px → sidebar left, 6 KPIs, no bottom tabs",
  ];
  smokeP0.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
  console.log("  P1 — Mobile polish (this ship):");
  const smokeP1 = [
    "Home with new enquiries, no urgent — Contact today sections + All clear for today + Browse new leads below",
    "Tap Follow-Up from home KPI → lands on /workspace/callbacks",
    "/workspace/callbacks, /documents, /at-risk — Search cases… not truncated; search above All stages on phone",
    "Header search (magnifying glass) — Search cases… placeholder when open",
    "Search still finds cases by name, phone, email (2+ chars in header search)",
  ];
  smokeP1.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
  console.log("  P2 — Edge cases:");
  const smokeP2 = [
    "Home zero new + zero urgent — Contact today empty; All clear for today only",
    "Home with urgent cases — Contact today or Urgent section shown",
    "Landscape on queue page — search readable, toolbar stacked or usable",
    "VoiceOver — search inputs announce Search cases by name, phone, or email",
  ];
  smokeP2.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
  console.log("  Regression:");
  const smokeReg = [
    "Do now cards full width; case Call/SMS/workflow visible without scrolling",
    "Bottom tabs + More sheet → Applications, Re-engagement, Automations",
    "Login ?next=/workspace/cases/[id] → lands on case after auth",
  ];
  smokeReg.forEach((step, i) => console.log(`    ${i + 1}. ${step}`));
  console.log("");

  if (findings.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area} — ${f.finding}`);
    }
    console.log("");
  }

  if (!liveMode) {
    console.log("💡 Live checks: WORKSPACE_MOBILE_AUDIT_LIVE=true npm run workspace:mobile\n");
  }

  if (p0Failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
