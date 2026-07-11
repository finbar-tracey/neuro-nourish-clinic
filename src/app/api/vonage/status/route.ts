import { NextRequest, NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { handleVonageDeliveryStatus } from "@/lib/sms-delivery";
import { verifyVonageWebhook } from "@/lib/vonage-webhook";

/** Vonage Messages API delivery status webhook. */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = await rateLimit(`vonage-status:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const rawBody = await request.text();
  const authorization = request.headers.get("authorization");

  if (!verifyVonageWebhook(authorization, rawBody)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  console.info("[Vonage status]", {
    messageUuid: payload.message_uuid,
    status: payload.status,
    to: payload.to,
    from: payload.from,
    error: payload.error,
  });

  try {
    await handleVonageDeliveryStatus(payload as Parameters<typeof handleVonageDeliveryStatus>[0]);
  } catch (error) {
    console.error("[Vonage status] CRM update failed", error);
  }

  return new NextResponse("", { status: 200 });
}
