#!/usr/bin/env npx tsx
/**
 * Email deliverability checklist — DNS, Resend domain, code wiring.
 * Run: npm run email:deliverability
 */
import { execSync } from "node:child_process";
import { config } from "dotenv";
import { readFileSync } from "node:fs";

config();

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function digTxt(name: string): string[] {
  try {
    const out = execSync(`dig +short TXT ${name}`, { encoding: "utf8" });
    return out
      .split("\n")
      .map((line) => line.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  console.log("\n📧 Email deliverability audit\n");

  const dmarc = digTxt("_dmarc.bridgingloansbroker.co.uk").join(" ");
  record("DMARC published", dmarc.includes("v=DMARC1"), dmarc || "missing");
  record(
    "DMARC policy not none",
    /p=(quarantine|reject)/i.test(dmarc),
    dmarc.match(/p=\w+/)?.[0] ?? "p=none?",
  );

  const sendSpf = digTxt("send.bridgingloansbroker.co.uk").join(" ");
  record("Resend SPF on send.*", sendSpf.includes("amazonses.com") || sendSpf.includes("spfm"), sendSpf || "missing");

  const emailTs = readFileSync("src/lib/email.ts", "utf8");
  record("List-Unsubscribe headers for marketing", emailTs.includes("List-Unsubscribe-Post"));
  record("From uses daniel@", emailTs.includes("resendFromAddress"));
  record("Unsubscribe endpoint", readFileSync("src/app/api/unsubscribe/[token]/route.ts", "utf8").includes("POST"));

  const from = process.env.RESEND_FROM ?? "";
  if (from) {
    record(
      "RESEND_FROM is personal daniel@ (not hello@)",
      from.toLowerCase().includes("daniel@bridgingloansbroker.co.uk"),
      from,
    );
  } else {
    record("RESEND_FROM local", false, "set daniel@ in Vercel production");
  }

  const key = process.env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = (await res.json()) as {
      data?: Array<{ name: string; status: string }>;
    };
    const domain = data.data?.find((d) => d.name === "bridgingloansbroker.co.uk");
    record("Resend domain verified", domain?.status === "verified", domain?.status ?? "not found");
  }

  console.log("\nManual (if still hitting spam):");
  console.log("  • Ask Daniel to mark daniel@ as trusted in Outlook (broker alerts use same domain)");
  console.log("  • Borrowers: mark Not spam once — rebuilds sender reputation");
  console.log("  • Google Postmaster Tools: add bridgingloansbroker.co.uk\n");

  const passed = checks.filter((c) => c.pass).length;
  console.log(`${passed}/${checks.length} automated checks passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
