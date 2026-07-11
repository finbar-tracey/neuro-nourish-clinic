#!/usr/bin/env npx tsx
import { config } from "dotenv";
config();

import { seedDemoData } from "../src/lib/demo-data";

async function main() {
  const result = await seedDemoData({ force: true });
  console.log(result.message);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
