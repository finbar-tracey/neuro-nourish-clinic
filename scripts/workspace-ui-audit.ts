#!/usr/bin/env npx tsx
/**
 * Workspace UI regression checks.
 * Run: npm run workspace:audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

const thankYou = read("src/components/forms/qualified-thank-you.tsx");
const inbox = read("src/components/workspace/inbox-board.tsx");
const caseCardWs = read("src/components/workspace/case-card.tsx");
const shell = read("src/components/workspace/shell.tsx");
const shellNav = read("src/components/workspace/shell-nav.ts");
const moreSheet = read("src/components/workspace/workspace-more-sheet.tsx");
const workspaceCase = read("src/lib/workspace-case.ts");
const operationalHome = read("src/components/workspace/operational-home.tsx");
const caseQueue = read("src/components/workspace/case-queue-board.tsx");
const reengagementBoard = read("src/components/workspace/reengagement-board.tsx");
const mobileSearch = read("src/components/workspace/workspace-mobile-search.tsx");
const workspaceUi = read("src/components/workspace/workspace-ui.tsx");
const sources = read("src/components/workspace/sources-report.tsx");

assert("Shared deserializeCaseView helper", workspaceCase.includes("deserializeCaseView"));
assert("Urgent feed deduplication", workspaceCase.includes("buildUrgentFeed"));
assert("Queue filter chips helper", workspaceCase.includes("filterCasesByChip"));
assert("Inbox uses operational data hook", inbox.includes("useOperationalData"));
assert("Inbox uses unified CaseCard", inbox.includes("CaseCard"));
assert("Inbox urgency filter chips", inbox.includes("WorkspaceFilterChips"));
assert("Queue board urgency filter chips", caseQueue.includes("WorkspaceFilterChips"));
assert("CaseCard unified footer", caseCardWs.includes("CaseCardFooter"));
assert("CaseCard full-card click target", caseCardWs.includes("absolute inset-0"));
assert("CaseCard accent border not full tint", caseCardWs.includes("border-l-4"));
assert("CaseCard inline next action", caseCardWs.includes("c.nextAction"));
assert("CaseCard pointer-events layering", caseCardWs.includes("pointer-events-none"));
assert("Mark documents received API", read("src/app/api/leads/[id]/route.ts").includes("markDocumentsReceived"));
assert("Stage-aware card workflow", read("src/lib/case-workflow.ts").includes("getCardWorkflow"));
assert("Unified card footer toolbar", read("src/components/workspace/case-card-footer.tsx").includes("CaseCardFooter"));
assert("Call workflow with voicemail", read("src/components/workspace/case-card-footer.tsx").includes("Voicemail"));
assert("Badge deduplication", caseCardWs.includes("pickCaseBadges"));
assert("Max 2 badges on cards", caseCardWs.includes("slice(0, 2)"));
assert("Workflow reveals after call", read("src/components/workspace/case-card-footer.tsx").includes("Log call outcome"));
assert("Footer error feedback", read("src/components/workspace/case-card-footer.tsx").includes("role=\"alert\""));
assert("CaseCard limits badge clutter", caseCardWs.includes("showQueue"));
assert("Home call now feed", operationalHome.includes("uncontactedNew"));
assert(
  "Home clickable KPI cards",
  operationalHome.includes('href="/workspace/inbox"') &&
    operationalHome.includes('href="/workspace/callbacks"'),
);
assert("KpiCard supports href", workspaceUi.includes("href?: string"));
assert("Collapsible pipeline sections", workspaceUi.includes("WorkspaceCollapsibleSection"));
assert("Nav counts API exists", read("src/app/api/workspace/nav-counts/route.ts").includes("queueNavCounts"));
assert("Shell loads nav badges", shell.includes("/api/workspace/nav-counts"));
assert("At-risk nav pulse", shell.includes("animate-pulse"));
assert("Documents nav count matches queue page", workspaceCase.includes('caseInQueuePage(c, "documents")'));
assert("Case detail uses real SLA data", read("src/components/workspace/case-detail.tsx").includes("computeSlaStatus(data"));
assert("Case detail attribution panel", read("src/components/workspace/case-detail.tsx").includes("AttributionPanel"));
assert("Case card attribution summary", read("src/components/workspace/case-card.tsx").includes("attributionSummary"));
assert("Sources campaign breakdown", read("src/app/api/workspace/sources/route.ts").includes("byCampaign"));
assert("Case detail load error state", read("src/components/workspace/case-detail.tsx").includes("loadError"));
assert("Case detail document view links", read("src/components/workspace/case-detail.tsx").includes("documentViewHref"));
assert(
  "Workspace document download API",
  existsSync(join(root, "src/app/api/leads/[id]/documents/[docId]/route.ts")),
);
assert("Upload POST error feedback", read("src/components/upload/borrower-upload.tsx").includes("uploadError"));
assert("Word docs allowed server-side", read("src/lib/document-storage.ts").includes("wordprocessingml"));
assert("Sources top performer highlight", sources.includes("topSource"));
assert("Sources mobile cards", sources.includes("md:hidden"));
assert("Thank-you container queries", thankYou.includes("@container"));
assert("Date coercion in utils", read("src/lib/utils.ts").includes("coerceDateMs"));

const middleware = read("src/middleware.ts");
assert("Centralised workspace auth middleware", middleware.includes("workspace_token"));
assert("Middleware protects workspace routes", middleware.includes('pathname.startsWith("/workspace")'));
assert("Shared useOperationalData hook", read("src/components/workspace/use-operational-data.ts").includes("useOperationalData"));
assert("Operational API error state component", workspaceUi.includes("WorkspaceErrorState"));
assert("Home shows operational load errors", operationalHome.includes("WorkspaceErrorState"));
assert("Inbox shows operational load errors", inbox.includes("WorkspaceErrorState"));
assert("Queue board shows operational load errors", caseQueue.includes("WorkspaceErrorState"));
assert("No client process-idle on page load", !operationalHome.includes("/api/workspace/process-idle"));
assert(
  "Automations in sidebar nav",
  shellNav.includes("/workspace/automations") &&
    (shell.includes("SHELL_NAV_SECTIONS") || shell.includes("shellNavSectionsForVertical")),
);
assert("Export CSV in sidebar", shell.includes("/api/leads/export"));
assert("Mobile bottom tab nav", shell.includes("fixed inset-x-0 bottom-0"));
assert("Grouped nav sections", shellNav.includes("Work today") && shellNav.includes("Archive & more"));
assert("Actionable badge policy", shellNav.includes("showBadge: false") && shellNav.includes("showBadge: true"));
assert("Mobile short labels", shellNav.includes("shortLabel:"));
assert("No attention strip pills (counts on nav badges only)", !shell.includes("AttentionStrip"));
assert("Desktop nav badges", shell.includes("function NavBadge") && shell.includes("countKey && showBadge"));
assert("Mobile tab badges", shell.includes("mobileTabBadgeCount"));
assert("Mobile more sheet", moreSheet.includes("WorkspaceMoreSheet") && shell.includes("WorkspaceMoreSheet"));
assert("No dead PipelineBoard component", !existsSync(join(root, "src/components/workspace/pipeline-board.tsx")));
assert("Login page hides env hint", !read("src/app/workspace/login/page.tsx").includes("WORKSPACE_SECRET"));
assert("Production hides load demo button", read("src/components/workspace/demo-data-banner.tsx").includes("demoAllowed"));
assert("Operational API includes completed cases", read("src/app/api/workspace/operational/route.ts").includes("cases: allCases"));
assert("Closed queue page", existsSync(join(root, "src/app/workspace/closed/page.tsx")));
assert("Closed queue routing", workspaceCase.includes('case "closed":'));
assert("Lost/disqualified in sidebar nav", shellNav.includes("/workspace/closed"));
assert("Completed cases normalize to COMPLETION queue", read("src/lib/operational-queue.ts").includes('caseStage === "COMPLETED"'));
assert("Case detail closed banner", read("src/components/workspace/case-detail.tsx").includes("/workspace/closed"));
assert("Case detail hides close actions when closed", read("src/components/workspace/case-detail.tsx").includes("!isCompleted && !isClosed"));
assert("API markLost uses transitionCaseStage", read("src/app/api/leads/[id]/route.ts").includes("markLost"));
assert("inferCaseStage prioritises LOST status", read("src/lib/case-stages.ts").includes('lead.status === "LOST"'));
assert("Re-engagement in sidebar nav", shellNav.includes("/workspace/re-engagement"));
assert("Re-engagement page route", existsSync(join(root, "src/app/workspace/re-engagement/page.tsx")));
assert("Re-engagement nav count", workspaceCase.includes("reengagement"));
assert("Win-back mark lost checkbox", read("src/components/workspace/case-detail.tsx").includes("startWinback"));
assert("Win-back processor on cron", read("src/app/api/cron/process-idle/route.ts").includes("processDueWinbackEmails"));
assert("Delete case API route", read("src/app/api/leads/[id]/route.ts").includes("export async function DELETE"));
assert("Delete case helper", existsSync(join(root, "src/lib/delete-lead-case.ts")));
assert("Case detail delete UI", read("src/components/workspace/case-detail.tsx").includes("Delete case permanently"));
assert("Delete requires confirmation", read("src/components/workspace/case-detail.tsx").includes('deleteConfirm !== "DELETE"'));
assert("Workspace login brand logo", read("src/app/workspace/login/page.tsx").includes("BrandLogo"));
assert("Workspace shell brand logo", shell.includes("BrandLogo"));
assert("Workspace dashboard brand logo", read("src/components/workspace/operational-home.tsx").includes("BrandLogo"));
assert("Mobile home uses isMobile hook", read("src/components/workspace/operational-home.tsx").includes("useIsMobile"));
assert("Case detail mobile bar", existsSync(join(root, "src/components/workspace/case-detail-mobile-bar.tsx")));
assert("Workspace mobile search", read("src/components/workspace/shell.tsx").includes("WorkspaceMobileSearch"));
assert("Home Call now section", operationalHome.includes("Call now"));
assert("Home Follow-up section", operationalHome.includes("Follow-up"));
assert("Home new leads KPI", operationalHome.includes("uncontactedNew"));
assert("Home empty state copy", operationalHome.includes("All clear"));
assert("Home empty state CTA", operationalHome.includes("Browse new leads"));
assert("Queue board mobile search placeholder", caseQueue.includes('placeholder="Search cases…"'));
assert("Queue board search aria-label", caseQueue.includes('aria-label="Search cases by name, phone, or email"'));
assert("Queue toolbar stacks on mobile", caseQueue.includes("flex-col sm:flex-row sm:items-center"));
assert("Inbox search placeholder", inbox.includes('placeholder="Search cases…"'));
assert("Re-engagement search placeholder", reengagementBoard.includes('placeholder="Search cases…"'));
assert("Mobile header search placeholder", mobileSearch.includes('placeholder="Search cases…"'));
assert("Mobile header search input aria-label", mobileSearch.includes('aria-label="Search cases by name, phone, or email"'));

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);

console.log("\nWorkspace UI audit\n");
for (const c of checks) {
  console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);

if (failed.length > 0) process.exit(1);
