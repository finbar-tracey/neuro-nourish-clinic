import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { runtimeSecret } from "@/lib/runtime-env";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = await rateLimit(`workspace-login:${ip}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let password: string | undefined;
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const secret = runtimeSecret("WORKSPACE_SECRET");

  if (!secret || !password || password !== secret) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("workspace_token", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("workspace_token");
  return response;
}
