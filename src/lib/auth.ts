import { NextRequest, NextResponse } from "next/server";

import { runtimeSecret } from "@/lib/runtime-env";

export function verifyWorkspaceAuth(request: NextRequest): boolean {
  const secret = runtimeSecret("WORKSPACE_SECRET");
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  const cookie = request.cookies.get("workspace_token")?.value;
  const headerToken = authHeader?.replace("Bearer ", "");

  return cookie === secret || headerToken === secret;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Vercel Cron sends Authorization: Bearer <CRON_SECRET>. Falls back to WORKSPACE_SECRET. */
export function verifyCronAuth(request: NextRequest): boolean {
  const secret = runtimeSecret("CRON_SECRET") ?? runtimeSecret("WORKSPACE_SECRET");
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  return token === secret;
}
