import { NextResponse } from "next/server";

import { checkGoLiveHealth } from "@/lib/go-live-health";

/** Read-only production go-live gate — verifies all integrations on the running server. */
export async function GET() {
  const health = await checkGoLiveHealth();
  return NextResponse.json(health);
}
