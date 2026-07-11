import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { runtimeSecret } from "@/lib/runtime-env";

const isNeuronourish =
  process.env.VERTICAL === "neuronourish" || process.env.NEXT_PUBLIC_VERTICAL === "neuronourish";

/** Legacy routes from other verticals — keep out of NeuroNourish crawl index. */
const NN_LEGACY_PREFIXES = ["/lp", "/for-clinics", "/email-preview"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isNeuronourish && NN_LEGACY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!pathname.startsWith("/workspace")) {
    return NextResponse.next();
  }

  const secret = runtimeSecret("WORKSPACE_SECRET");
  const token = request.cookies.get("workspace_token")?.value;
  const authed = Boolean(secret && token === secret);

  if (pathname === "/workspace/login") {
    if (authed) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL("/workspace/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace",
    "/workspace/:path*",
    "/lp",
    "/lp/:path*",
    "/for-clinics",
    "/for-clinics/:path*",
    "/email-preview",
    "/email-preview/:path*",
  ],
};
