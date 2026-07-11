#!/usr/bin/env npx tsx
/**
 * Print the BLB Daniel CRM v2 10/10 post-implementation agent prompt.
 * Run: npm run crm-v2:prompt
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const docPath = join(process.cwd(), "docs", "CRM_V2_POST_IMPLEMENTATION.md");
const doc = readFileSync(docPath, "utf8");

const start = doc.indexOf("```\nBLB — CRM V2 POST-IMPLEMENTATION");
const end = doc.indexOf("```", start + 4);
if (start === -1 || end === -1) {
  console.error("Could not extract agent prompt from docs/CRM_V2_POST_IMPLEMENTATION.md");
  process.exit(1);
}

const prompt = doc.slice(start + 4, end).trimEnd();
console.log(prompt);
