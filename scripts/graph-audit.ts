#!/usr/bin/env npx tsx
/**
 * Microsoft Graph readiness — token, calendar read, optional test event.
 * Does NOT book a real call; optional GRAPH_AUDIT_CREATE_EVENT=true creates a
 * 30-min test event 7 days out (deleted manually in Outlook).
 *
 * Run: npm run graph:audit
 * With Vercel prod env: vercel pull && npm run graph:audit
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const vercelEnv = resolve(".vercel/.env.production.local");
config();
if (existsSync(vercelEnv)) {
  for (const line of readFileSync(vercelEnv, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    const value = raw.trim().replace(/^"(.*)"$/, "$1");
    if (value) process.env[key] = value;
  }
}

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function organizerEmail(): string {
  return (
    env("BROKER_CALENDAR_EMAIL") ||
    env("MICROSOFT_USER_ID") ||
    env("MS_GRAPH_ORGANIZER_EMAIL")
  );
}

async function getToken(): Promise<string | null> {
  const tenantId = env("MICROSOFT_TENANT_ID") || env("MS_GRAPH_TENANT_ID");
  const clientId = env("MICROSOFT_CLIENT_ID") || env("MS_GRAPH_CLIENT_ID");
  const clientSecret =
    env("MICROSOFT_CLIENT_SECRET") || env("MS_GRAPH_CLIENT_SECRET");

  if (!tenantId || !clientId || !clientSecret) return null;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    record("OAuth token", false, `HTTP ${res.status}: ${body.slice(0, 120)}`);
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    record("OAuth token", false, "No access_token in response");
    return null;
  }

  record("OAuth token", true, "Client credentials OK");
  return data.access_token;
}

async function main() {
  console.log("\n📅 Microsoft Graph audit\n");

  const organizer = organizerEmail();
  record("MICROSOFT_TENANT_ID", Boolean(env("MICROSOFT_TENANT_ID") || env("MS_GRAPH_TENANT_ID")));
  record("MICROSOFT_CLIENT_ID", Boolean(env("MICROSOFT_CLIENT_ID") || env("MS_GRAPH_CLIENT_ID")));
  record(
    "MICROSOFT_CLIENT_SECRET",
    Boolean(env("MICROSOFT_CLIENT_SECRET") || env("MS_GRAPH_CLIENT_SECRET")),
  );
  record("BROKER_CALENDAR_EMAIL", Boolean(organizer), organizer || "not set");

  if (!organizer) {
    console.log("\n⏳ Graph not configured — booking works without Teams/calendar sync.\n");
    console.log("Set Azure app vars + BROKER_CALENDAR_EMAIL, then redeploy.\n");
    process.exit(0);
  }

  const token = await getToken();
  if (!token) {
    printSummary();
    process.exit(1);
  }

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const startIso = start.toISOString().slice(0, 19);
  const endIso = end.toISOString().slice(0, 19);

  const scheduleRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer)}/calendar/getSchedule`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schedules: [organizer],
        startTime: { dateTime: startIso, timeZone: "Europe/London" },
        endTime: { dateTime: endIso, timeZone: "Europe/London" },
        availabilityViewInterval: 30,
      }),
    },
  );

  if (scheduleRes.ok) {
    record("Calendars.Read (getSchedule)", true, "Calendar availability API OK");
  } else {
    const body = await scheduleRes.text().catch(() => "");
    record(
      "Calendars.Read (getSchedule)",
      false,
      `HTTP ${scheduleRes.status} — grant Calendars.Read application permission + admin consent. ${body.slice(0, 80)}`,
    );
  }

  if (process.env.GRAPH_AUDIT_CREATE_EVENT === "true") {
    const eventRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "BLB CRM Graph audit test (safe to delete)",
          start: { dateTime: startIso, timeZone: "Europe/London" },
          end: { dateTime: endIso, timeZone: "Europe/London" },
          isOnlineMeeting: true,
          onlineMeetingProvider: "teamsForBusiness",
        }),
      },
    );

    if (eventRes.ok) {
      const event = (await eventRes.json()) as {
        id?: string;
        onlineMeeting?: { joinUrl?: string };
      };
      record(
        "Calendars.ReadWrite (create event + Teams)",
        true,
        event.onlineMeeting?.joinUrl ? "Teams join URL returned" : "Event created (no Teams URL)",
      );
      if (event.id) {
        console.log(`   Test event id: ${event.id} — delete in Outlook when done.`);
      }
    } else {
      const body = await eventRes.text().catch(() => "");
      record(
        "Calendars.ReadWrite (create event + Teams)",
        false,
        `HTTP ${eventRes.status} — grant Calendars.ReadWrite application permission + admin consent. ${body.slice(0, 80)}`,
      );
    }
  } else {
    console.log(
      "\nℹ️  Skipping test calendar event (set GRAPH_AUDIT_CREATE_EVENT=true to verify Teams link creation).\n",
    );
  }

  printSummary();
  process.exit(checks.every((c) => c.pass) ? 0 : 1);
}

function printSummary() {
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  console.log(`\n📊 Graph audit: ${passed}/${total} checks passed\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
