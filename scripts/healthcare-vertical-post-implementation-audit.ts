#!/usr/bin/env npx tsx
/**
 * Booked Consult vertical — post-implementation audit.
 *
 * Pre-deploy (static + local runtime):
 *   npm run healthcare:post-implementation
 *
 * After BLB deploy:
 *   BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run healthcare:post-implementation
 *
 * After Booked Consult deploy:
 *   BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk \
 *   HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com \
 *   npm run healthcare:post-implementation
 *
 * Live API smoke (creates real leads — delete in workspace after):
 *   HEALTHCARE_POST_AUDIT_LIVE=true \
 *   BLB_POST_IMPL_URL=... HEALTHCARE_POST_IMPL_URL=... \
 *   npm run healthcare:post-implementation
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { POST as leadsPost } from "@/app/api/leads/route";
import { POST as bookingIntentPost } from "@/app/api/leads/booking-intent/route";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import { HEALTHCARE_NAV_SECTIONS, MOBILE_TAB_HREFS, SHELL_NAV_SECTIONS } from "@/components/workspace/shell-nav";
import { db } from "@/lib/db";
import {
  HEALTHCARE_BANNED_PATTERNS,
  HEALTHCARE_LP_FILES,
} from "@/lib/healthcare-compliance";
import { HEALTHCARE_B2B_METADATA, HEALTHCARE_FOR_CLINICS } from "@/lib/healthcare-lp-copy";
import { META_LP_METADATA } from "@/lib/meta-lp-copy";
import {
  brandName,
  crmFileStoreName,
  crmKvKeyName,
  defaultCaseOwner,
  getVertical,
  isHealthcare,
} from "@/lib/vertical-config";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  phase: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
  skipped?: boolean;
};

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const checks: Check[] = [];
const cleanupLeadIds: string[] = [];

function check(
  id: string,
  phase: string,
  pass: boolean,
  detail?: string,
  severity: Severity = "P0",
  skipped = false,
) {
  checks.push({ id, phase, pass, detail, severity, skipped });
  const icon = skipped ? "○" : pass ? "✓" : "✗";
  console.log(`${icon} [${phase}] ${id} ${detail ?? ""}`.trimEnd());
}

function runNpm(script: string): { ok: boolean; out: string } {
  try {
    const out = execSync(`npm run ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NOTIFICATIONS_DRY_RUN: "true", META_CAPI_DRY_RUN: "true" },
    });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function fetchText(url: string, redirect: RequestRedirect = "follow") {
  const res = await fetch(url, { redirect });
  return { res, html: await res.text(), finalUrl: res.url };
}

function healthcarePayload(email: string) {
  return {
    vertical: "healthcare" as const,
    stage: "complete" as const,
    firstName: "Post",
    lastName: "Audit",
    email,
    phone: "07123456789",
    treatmentType: "single_implant",
    timeline: "within_3_months",
    postcode: "SW1A 1AA",
    budgetBand: "5k_10k",
    consent: true as const,
    source: "healthcare_post_impl_audit",
  };
}

async function runStaticGates() {
  console.log("\n── Phase 0: Static gates ──\n");

  const protect = runNpm("vertical:protect");
  check("S01", "Static", protect.ok, protect.ok ? "vertical:protect PASS" : "vertical:protect FAIL");

  const metaLp = runNpm("meta-lp:audit");
  check("S02", "Static", metaLp.ok, metaLp.ok ? "meta-lp:audit PASS" : "meta-lp:audit FAIL");

  const notifications = runNpm("notifications:audit");
  check(
    "S03",
    "Static",
    notifications.ok,
    notifications.ok ? "notifications:audit PASS" : "notifications:audit FAIL",
    "P1",
  );

  const nav = runNpm("workspace:nav");
  check(
    "S04",
    "Static",
    nav.ok,
    nav.ok ? "workspace:nav PASS" : "workspace:nav FAIL (see G44 mobileTabs vs MOBILE_TAB_HREFS)",
    "P1",
  );

  check("S05", "Static", read("package.json").includes('"healthcare:post-implementation"'));
  check("S06", "Static", read("package.json").includes('"healthcare-ads:post-implementation"'), "healthcare ads gate registered", "P1");
}

function runCodeReview() {
  console.log("\n── Phase 1: Code review ──\n");

  delete process.env.VERTICAL;
  delete process.env.NEXT_PUBLIC_VERTICAL;

  // A — BLB isolation
  check("A01", "BLB isolation", getVertical() === "bridging", "getVertical defaults bridging");
  check("A02", "BLB isolation", crmFileStoreName() === ".blb-crm.json");
  check("A03", "BLB isolation", crmKvKeyName() === "bridging-loans-broker:crm");
  check("A04", "BLB isolation", brandName() === "Bridging Loans Broker");
  check(
    "A05",
    "BLB isolation",
    !/healthcare|booked consult/i.test(read("src/lib/meta-lp-copy.ts")),
    "meta-lp-copy clean",
  );

  const home = read("src/app/page.tsx");
  check("A06", "BLB isolation", home.includes("FacebookLandingPage"));
  check("A07", "BLB isolation", home.includes("isHealthcare()"));

  const leadsRoute = read("src/app/api/leads/route.ts");
  check("A08", "BLB isolation", leadsRoute.includes('body?.vertical === "healthcare"'));

  const metaLpAudit = read("scripts/meta-lp-compliance-audit.ts");
  check(
    "A09",
    "BLB isolation",
    !metaLpAudit.includes("healthcare-lp-copy") && !metaLpAudit.includes("for-clinics"),
    "meta-lp:audit file list unchanged",
  );

  const shell = read("src/components/workspace/shell.tsx");
  check(
    "A10",
    "BLB isolation",
    shell.includes("shellNavSectionsForVertical") && shell.includes("mobileTabHrefsForVertical"),
  );

  const caseWorkflow = read("src/lib/case-workflow.ts");
  check(
    "A11",
    "BLB isolation",
    caseWorkflow.includes("isHealthcareVertical()"),
    "document workflow gated",
  );

  // B — Healthcare wiring
  process.env.VERTICAL = "healthcare";
  process.env.NEXT_PUBLIC_VERTICAL = "healthcare";

  check("B01", "Healthcare wiring", isHealthcare());
  check("B02", "Healthcare wiring", brandName() === "Booked Consult");
  check("B03", "Healthcare wiring", crmFileStoreName() === ".booked-consult-crm.json");
  check("B04", "Healthcare wiring", crmKvKeyName() === "booked-consult:crm");
  check("B05", "Healthcare wiring", defaultCaseOwner() === "Clinic", "default owner when PARTNER_NAME unset");

  for (const file of HEALTHCARE_LP_FILES) {
    check("B06", "Healthcare wiring", existsSync(join(root, file)), file, "P0");
  }

  for (const file of HEALTHCARE_LP_FILES) {
    const content = read(file);
    for (const { label, pattern } of HEALTHCARE_BANNED_PATTERNS) {
      for (const line of content.split("\n")) {
        if (pattern.test(line)) {
          check("B07", "Healthcare compliance", false, `${file}: banned ${label}`, "P0");
        }
      }
    }
  }
  if (!checks.some((c) => c.id === "B07" && !c.pass)) {
    check("B07", "Healthcare compliance", true, "no banned phrases in LP files");
  }

  check("B08", "Healthcare wiring", home.includes('redirect("/for-clinics")'));
  check("B09", "Healthcare wiring", leadsRoute.includes("handleHealthcareLeadPost"));

  const layout = read("src/app/layout.tsx");
  check("B10", "Healthcare wiring", layout.includes("generateMetadata") && layout.includes("isHealthcare()"));

  const bookingIntent = read("src/app/api/leads/booking-intent/route.ts");
  check(
    "B11",
    "Healthcare wiring",
    bookingIntent.includes("chaseBookingIntent") && bookingIntent.includes("isHealthcare()"),
  );

  check(
    "B12",
    "Healthcare nav",
    !HEALTHCARE_NAV_SECTIONS.flatMap((s) => s.items).some((i) => i.href.includes("documents")),
    "Documents hidden",
  );
  check(
    "B13",
    "Healthcare nav",
    SHELL_NAV_SECTIONS.flatMap((s) => s.items).some((i) => i.href.includes("documents")),
    "BLB nav still has Documents",
  );
  check("B14", "Healthcare nav", MOBILE_TAB_HREFS.length === 4, "BLB mobile tabs = 4 (Home, New, Follow-Up, Completed)");

  const envExample = read(".env.example");
  check("B15", "Healthcare wiring", envExample.includes("VERTICAL=") && envExample.includes("bookedconsult.com"));
}

async function runLocalRuntime() {
  console.log("\n── Phase 2: Local runtime (dry-run notifications) ──\n");

  const blbEmail = `blb-post-impl-${Date.now()}@test.local`;
  const hcEmail = `hc-post-impl-${Date.now()}@test.local`;

  try {
    delete process.env.VERTICAL;
    delete process.env.NEXT_PUBLIC_VERTICAL;

    const captureRes = await leadsPost(
      jsonRequest("http://localhost/api/leads", {
        stage: "capture",
        firstName: "BLB",
        lastName: "PostImpl",
        email: blbEmail,
        phone: "07111222333",
        loanPurpose: "purchase",
        loanAmount: 350000,
        timeframe: "30_days",
        consent: true,
        source: "healthcare_post_impl_audit",
      }),
    );
    const captureJson = (await captureRes.json()) as { leadId?: string; id?: string; errors?: unknown };
    const blbLeadId = captureJson.leadId ?? captureJson.id;
    check(
      "R01",
      "Local runtime",
      captureRes.ok && !!blbLeadId,
      blbLeadId ? `BLB capture ${blbLeadId}` : JSON.stringify(captureJson.errors),
    );
    if (blbLeadId) cleanupLeadIds.push(blbLeadId);

    process.env.VERTICAL = "healthcare";
    process.env.NEXT_PUBLIC_VERTICAL = "healthcare";

    const hcRes = await leadsPost(
      jsonRequest("http://localhost/api/leads", healthcarePayload(hcEmail)),
    );
    const hcJson = (await hcRes.json()) as {
      id?: string;
      leadId?: string;
      qualified?: boolean;
      disqualified?: boolean;
      errors?: unknown;
    };
    const hcLeadId = hcJson.id ?? hcJson.leadId;
    check(
      "R02",
      "Local runtime",
      hcRes.status === 201 && !!hcLeadId && hcJson.qualified === true && !hcJson.disqualified,
      hcLeadId ? `healthcare lead ${hcLeadId}` : JSON.stringify(hcJson),
    );

    if (hcLeadId) {
      cleanupLeadIds.push(hcLeadId);
      const lead = await db.lead.findUnique({ where: { id: hcLeadId } });
      check(
        "R03",
        "Local runtime",
        lead?.additionalInfo?.includes("[Healthcare]") ?? false,
        "healthcare additionalInfo set",
      );
      check("R04", "Local runtime", lead?.owner === "Clinic", `owner=${lead?.owner}`);

      const intentRes = await bookingIntentPost(
        jsonRequest("http://localhost/api/leads/booking-intent", {
          leadId: hcLeadId,
          preferredSlot: "Tue 10:30",
        }),
      );
      check("R05", "Local runtime", intentRes.ok, "booking-intent POST");

      const task = await db.task.findFirst({
        where: { leadId: hcLeadId, title: { startsWith: "Booking intent" } },
      });
      check("R06", "Local runtime", !!task, "booking-intent task created");

      const updated = await db.lead.findUnique({ where: { id: hcLeadId } });
      check(
        "R07",
        "Local runtime",
        updated?.nextAction?.includes("not reserved") ?? false,
        updated?.nextAction ?? undefined,
      );
    }

    delete process.env.VERTICAL;
    delete process.env.NEXT_PUBLIC_VERTICAL;

    const crossRes = await leadsPost(
      jsonRequest("http://localhost/api/leads", {
        ...healthcarePayload(`cross-${Date.now()}@test.local`),
      }),
    );
    const crossJson = (await crossRes.json()) as { id?: string; leadId?: string };
    const crossLeadId = crossJson.id ?? crossJson.leadId;
    check(
      "R08",
      "Local runtime",
      crossRes.status === 201 && !!crossLeadId,
      "healthcare POST works without VERTICAL=healthcare (body.vertical opt-in)",
    );
    if (crossLeadId) cleanupLeadIds.push(crossLeadId);
  } catch (err) {
    check("R99", "Local runtime", false, String(err));
  }
}

function runEnvAudit(liveMode: boolean) {
  console.log("\n── Phase 3: Vercel env advisory ──\n");

  if (!liveMode) {
    check(
      "E00",
      "Env",
      true,
      "skipped — set HEALTHCARE_POST_AUDIT_LIVE=true after configuring Vercel env",
      "P1",
      true,
    );
    return;
  }

  const blbUrl = (process.env.BLB_POST_IMPL_URL ?? "").replace(/\/$/, "");
  const hcUrl = (process.env.HEALTHCARE_POST_IMPL_URL ?? "").replace(/\/$/, "");

  check("E01", "Env", !!blbUrl, "BLB_POST_IMPL_URL set", "P0");
  check("E02", "Env", !!hcUrl, "HEALTHCARE_POST_IMPL_URL set", "P0");

  const vertical = process.env.VERTICAL?.toLowerCase();
  const pubVertical = process.env.NEXT_PUBLIC_VERTICAL?.toLowerCase();
  const kvUrl = process.env.KV_REST_API_URL?.trim();
  const crmKey = process.env.CRM_KV_KEY?.trim();

  if (hcUrl && blbUrl) {
    check(
      "E03",
      "Env",
      vertical === "healthcare",
      `VERTICAL=${vertical ?? "unset"} (expect healthcare on Booked Consult deploy machine)`,
      "P1",
    );
    check(
      "E04",
      "Env",
      pubVertical === "healthcare",
      `NEXT_PUBLIC_VERTICAL=${pubVertical ?? "unset"}`,
      "P1",
    );
    check("E05", "Env", crmKey === "booked-consult:crm", `CRM_KV_KEY=${crmKey ?? "unset"}`, "P1");
    check("E06", "Env", !!kvUrl, "KV_REST_API_URL set (must be dedicated store B)", "P0");
    check(
      "E07",
      "Env",
      (process.env.NEXT_PUBLIC_SITE_URL ?? "").includes("bookedconsult.com"),
      `NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL ?? "unset"}`,
      "P1",
    );
    check(
      "E08",
      "Env",
      (process.env.RESEND_FROM ?? "").toLowerCase().includes("bookedconsult"),
      "RESEND_FROM uses bookedconsult.com",
      "P1",
    );
  }
}

async function runBlbLiveSmoke(baseUrl: string) {
  console.log("\n── Phase 4: BLB live smoke ──\n");

  if (!baseUrl) {
    check(
      "L01",
      "BLB live",
      true,
      "skipped — set BLB_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk",
      "P0",
      true,
    );
    return;
  }

  try {
    const home = await fetchText(`${baseUrl}/`);
    check("L01", "BLB live", home.res.ok, `GET / → ${home.res.status}`);
    check(
      "L02",
      "BLB live",
      !home.finalUrl.includes("/for-clinics"),
      `no redirect to for-clinics (${home.finalUrl})`,
    );
    check(
      "L03",
      "BLB live",
      home.html.includes("Finance Enquiry") || home.html.includes(META_LP_METADATA.title.split("|")[0]!.trim()),
      "bridging LP content",
    );
    check(
      "L04",
      "BLB live",
      !home.html.includes(HEALTHCARE_FOR_CLINICS.headline),
      "no Booked Consult B2B headline on BLB home",
    );

    const lp = await fetchText(`${baseUrl}/lp?utm_source=facebook&utm_medium=paid&utm_campaign=LONDON_BLB`);
    check("L05", "BLB live", lp.res.ok, `GET /lp → ${lp.res.status}`);
    check(
      "L06",
      "BLB live",
      lp.html.includes("Broker, not a lender") || lp.html.includes("Business &amp; investment only"),
      "compliance strip on /lp",
    );
    check("L07", "BLB live", !lp.html.includes("implant consultation"), "no implant copy on BLB /lp");

    const clinics = await fetchText(`${baseUrl}/for-clinics`);
    check(
      "L08",
      "BLB live",
      clinics.res.ok,
      "/for-clinics reachable (route exists in shared repo)",
      "P2",
    );
  } catch (err) {
    check("L99", "BLB live", false, String(err));
  }
}

async function runHealthcareLiveSmoke(baseUrl: string) {
  console.log("\n── Phase 5: Booked Consult live smoke ──\n");

  if (!baseUrl) {
    check(
      "H01",
      "Healthcare live",
      true,
      "skipped — set HEALTHCARE_POST_IMPL_URL=https://bookedconsult.com",
      "P0",
      true,
    );
    return;
  }

  try {
    const home = await fetchText(`${baseUrl}/`);
    check("H01", "Healthcare live", home.res.ok, `GET / → ${home.res.status}`);
    check(
      "H02",
      "Healthcare live",
      home.finalUrl.includes("/for-clinics"),
      `redirects to for-clinics (${home.finalUrl})`,
    );

    const clinics = await fetchText(`${baseUrl}/for-clinics`);
    check("H03", "Healthcare live", clinics.res.ok, `GET /for-clinics → ${clinics.res.status}`);
    check(
      "H04",
      "Healthcare live",
      clinics.html.includes(HEALTHCARE_FOR_CLINICS.headline) || clinics.html.includes("Booked Consult"),
      "B2B clinic copy",
    );
    check(
      "H05",
      "Healthcare live",
      clinics.html.includes(HEALTHCARE_B2B_METADATA.title.split("|")[0]!.trim()) ||
        clinics.html.includes("Qualified implant"),
      "Booked Consult metadata/copy",
    );

    const implants = await fetchText(`${baseUrl}/lp/implants`);
    check("H06", "Healthcare live", implants.res.ok, `GET /lp/implants → ${implants.res.status}`);
    check(
      "H07",
      "Healthcare live",
      implants.html.includes("implant") && !implants.html.includes("not regulated by the FCA"),
      "patient LP without FCA disclaimer",
    );
    check(
      "H08",
      "Healthcare live",
      !implants.html.includes("Bridging Loans Broker"),
      "no BLB brand on implants LP",
    );

    const blbLp = await fetchText(`${baseUrl}/lp/auction`);
    check(
      "H09",
      "Healthcare live",
      blbLp.res.status === 404 || !blbLp.html.includes("Broker, not a lender"),
      "finance angle LP not primary on healthcare domain",
      "P2",
    );
  } catch (err) {
    check("H99", "Healthcare live", false, String(err));
  }
}

async function runCrossContamination(blbUrl: string, hcUrl: string, liveApi: boolean) {
  console.log("\n── Phase 6: Cross-contamination ──\n");

  if (!blbUrl || !hcUrl) {
    check(
      "X01",
      "Cross-contam",
      true,
      "skipped — set both BLB_POST_IMPL_URL and HEALTHCARE_POST_IMPL_URL",
      "P0",
      true,
    );
    return;
  }

  try {
    const [blbHome, hcHome] = await Promise.all([
      fetchText(`${blbUrl}/`),
      fetchText(`${hcUrl}/`),
    ]);
    check(
      "X01",
      "Cross-contam",
      !blbHome.finalUrl.includes("/for-clinics") && hcHome.finalUrl.includes("/for-clinics"),
      "home routing differs per deploy",
    );
    check(
      "X02",
      "Cross-contam",
      !blbHome.html.includes(HEALTHCARE_FOR_CLINICS.pilotPrice),
      "BLB home has no £2,500 pilot pricing",
    );
    check(
      "X03",
      "Cross-contam",
      !hcHome.html.includes(META_LP_METADATA.title) || hcHome.finalUrl.includes("/for-clinics"),
      "healthcare home is not BLB meta LP",
    );

    if (!liveApi) {
      check(
        "X04",
        "Cross-contam",
        true,
        "skipped live API — HEALTHCARE_POST_AUDIT_LIVE=true to POST test leads",
        "P1",
        true,
      );
      return;
    }

    const stamp = Date.now();
    const hcEmail = `hc-cross-${stamp}@post-impl-audit.test`;
    const hcRes = await fetch(`${hcUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(healthcarePayload(hcEmail)),
    });
    const hcJson = (await hcRes.json()) as { id?: string; leadId?: string; disqualified?: boolean };
    const liveLeadId = hcJson.id ?? hcJson.leadId;
    check(
      "X04",
      "Cross-contam",
      hcRes.status === 201 && !!liveLeadId,
      `healthcare API lead ${liveLeadId ?? "failed"}`,
    );

    check(
      "X05",
      "Cross-contam",
      true,
      "Manual: confirm lead NOT in BLB workspace; delete test lead in Booked Consult workspace",
      "P0",
    );
  } catch (err) {
    check("X99", "Cross-contam", false, String(err));
  }
}

function printVerdict(blbUrl: string, hcUrl: string) {
  const automated = checks.filter((c) => !c.skipped);
  const p0Failed = automated.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = automated.filter((c) => !c.pass && c.severity === "P1");
  const passed = automated.filter((c) => c.pass).length;

  console.log("\n── Verdict ──\n");
  console.log(`Automated: ${passed}/${automated.length} passed`);
  console.log(`P0 failures: ${p0Failed.length}`);
  console.log(`P1 failures: ${p1Failed.length}`);

  if (!blbUrl) {
    console.log("\nBLB live: NOT RUN — set BLB_POST_IMPL_URL after Project A deploy");
  } else {
    console.log(`\nBLB live: ${p0Failed.some((c) => c.phase === "BLB live") ? "FAIL" : "PASS"} (${blbUrl})`);
  }

  if (!hcUrl) {
    console.log("Healthcare live: NOT RUN — set HEALTHCARE_POST_IMPL_URL after Project B deploy");
  } else {
    console.log(
      `Healthcare live: ${p0Failed.some((c) => c.phase === "Healthcare live") ? "FAIL" : "PASS"} (${hcUrl})`,
    );
  }

  const shipBlb = p0Failed.filter((c) => c.phase !== "Healthcare live" && c.phase !== "Cross-contam").length === 0;
  const shipHc =
    blbUrl &&
    hcUrl &&
    p0Failed.length === 0 &&
    !checks.some((c) => c.phase === "Healthcare live" && !c.pass && c.severity === "P0");

  console.log(`\nShip Project A (BLB): ${shipBlb && blbUrl ? "YES" : blbUrl ? "NO" : "pending live URL"}`);
  console.log(
    `Ship Project B (Booked Consult): ${shipHc ? "YES" : hcUrl ? "NO" : "pending live URL"}`,
  );
  console.log(
    `Ready for pilot Meta ads: ${shipHc ? "YES (after clinic copy approval + manual CRM isolation check)" : "NO"}`,
  );

  if (p0Failed.length > 0) {
    console.log("\nP0 failures:");
    for (const f of p0Failed) {
      console.log(`  • [${f.phase}] ${f.id}${f.detail ? `: ${f.detail}` : ""}`);
    }
  }

  console.log("");
}

async function cleanup() {
  for (const id of cleanupLeadIds) {
    await deleteLeadCase(id).catch(() => null);
  }
}

async function main() {
  const blbUrl = (process.env.BLB_POST_IMPL_URL ?? process.env.META_LP_POST_IMPL_URL ?? "").replace(
    /\/$/,
    "",
  );
  const hcUrl = (process.env.HEALTHCARE_POST_IMPL_URL ?? "").replace(/\/$/, "");
  const liveMode = process.env.HEALTHCARE_POST_AUDIT_LIVE === "true";

  console.log("\nBooked Consult vertical — post-implementation audit\n");
  console.log(`BLB URL: ${blbUrl || "(not set)"}`);
  console.log(`Healthcare URL: ${hcUrl || "(not set)"}`);
  console.log(`Live env/API mode: ${liveMode}\n`);

  await runStaticGates();
  runCodeReview();
  await runLocalRuntime();
  runEnvAudit(liveMode);
  await runBlbLiveSmoke(blbUrl);
  await runHealthcareLiveSmoke(hcUrl);
  await runCrossContamination(blbUrl, hcUrl, liveMode);
  await cleanup();

  printVerdict(blbUrl, hcUrl);

  const p0Failed = checks.filter((c) => !c.skipped && !c.pass && c.severity === "P0");
  process.exit(p0Failed.length === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
