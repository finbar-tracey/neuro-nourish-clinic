import { NextRequest, NextResponse } from "next/server";

import {
  emailFromUnsubscribeToken,
  optOutEmailAddress,
} from "@/lib/email-unsubscribe";

function htmlPage(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Unsubscribe</title></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:48px auto;padding:0 16px;color:#1c1c55">
  <h1 style="font-size:22px">Email preferences</h1>
  <p style="line-height:1.6;color:#334155">${message}</p>
</body>
</html>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const email = emailFromUnsubscribeToken(token);
  if (!email) {
    return new NextResponse(htmlPage("This unsubscribe link is invalid or has expired."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await optOutEmailAddress(email);
  return new NextResponse(
    htmlPage(
      "You have been unsubscribed from marketing emails from Bridging Loans Broker. You may still receive essential messages about an active enquiry or booking.",
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

/** RFC 8058 one-click unsubscribe (Gmail / Yahoo). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const email = emailFromUnsubscribeToken(token);
  if (!email) {
    return new NextResponse(null, { status: 400 });
  }

  const body = await request.text().catch(() => "");
  if (body && !body.includes("List-Unsubscribe=One-Click")) {
    return new NextResponse(null, { status: 400 });
  }

  await optOutEmailAddress(email);
  return new NextResponse(null, { status: 200 });
}
