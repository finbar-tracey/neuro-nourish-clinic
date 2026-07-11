#!/usr/bin/env npx tsx
/**
 * After `vercel pull`, Vercel masks secrets as empty strings in
 * `.vercel/.env.production.local`. Those empty values can override real
 * production env at build time. Drop blank server secrets so runtime env wins.
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".vercel/.env.production.local");
if (!fs.existsSync(envPath)) {
  console.log("No .vercel/.env.production.local — skip");
  process.exit(0);
}

const STRIP_IF_EMPTY_PREFIXES = [
  "VONAGE_",
  "WORKSPACE_SECRET",
  "CRON_SECRET",
  "RESEND_",
  "MICROSOFT_",
  "META_CAPI_",
  "KV_REST_",
  "BLOB_",
];

const lines = fs.readFileSync(envPath, "utf8").split("\n");
let removed = 0;
const out = lines.filter((line) => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) return true;
  const [, key, raw] = m;
  const val = raw.replace(/^["']|["']$/g, "");
  if (val !== "") return true;
  if (!STRIP_IF_EMPTY_PREFIXES.some((p) => key.startsWith(p) || key === p)) return true;
  removed++;
  return false;
});

fs.writeFileSync(envPath, out.join("\n"));
console.log(`Stripped ${removed} empty masked secret(s) from .vercel/.env.production.local`);
