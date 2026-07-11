import { NextResponse } from "next/server";
import { destroyPatientSession } from "@/lib/neuronourish-auth-session";
import { siteUrl } from "@/lib/site-url";

export async function POST(request: Request) {
  await destroyPatientSession();
  return NextResponse.redirect(new URL("/login", siteUrl() || request.url), 303);
}
