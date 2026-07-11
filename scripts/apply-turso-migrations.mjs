#!/usr/bin/env node
/**
 * Applies all Prisma/SQLite migrations to Turso via libsql HTTP API.
 * Run after deploy setup: npm run db:turso:migrate
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in env.
 */
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running.");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "prisma/migrations");
const sqlFiles = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()
  .flatMap((dir) => {
    const path = join(migrationsDir, dir, "migration.sql");
    try {
      return [readFileSync(path, "utf8")];
    } catch {
      return [];
    }
  });

if (sqlFiles.length === 0) {
  console.error("No migration SQL files found.");
  process.exit(1);
}

const client = createClient({ url, authToken });

for (const sql of sqlFiles) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const statement of statements) {
    await client.execute(`${statement};`);
  }
}

console.log(`Applied ${sqlFiles.length} migration file(s) to Turso.`);
await client.close();
