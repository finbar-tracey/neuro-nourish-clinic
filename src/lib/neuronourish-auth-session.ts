import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { runtimeSecret } from "@/lib/runtime-env";

export const AUTH_COOKIE_NAME = "neuronourish_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface PatientSessionPayload {
  leadId: string;
  email: string;
  name: string;
}

function jwtSecretKey(): Uint8Array {
  const secret =
    runtimeSecret("WORKSPACE_SECRET") ??
    runtimeSecret("CRON_SECRET") ??
    "dev-neuronourish-secret-fallback-key-32-chars-minimum";
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: PatientSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecretKey());
}

export async function decryptSession(sessionToken: string): Promise<PatientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(sessionToken, jwtSecretKey(), {
      algorithms: ["HS256"],
    });
    const leadId = typeof payload.leadId === "string" ? payload.leadId : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    if (!leadId || !email || !name) return null;
    return { leadId, email, name };
  } catch {
    return null;
  }
}

export async function createPatientSession(payload: PatientSessionPayload): Promise<void> {
  const sessionToken = await encryptSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyPatientSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getActivePatientSession(): Promise<PatientSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export function patientSessionFromLead(lead: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}): PatientSessionPayload {
  return {
    leadId: lead.id,
    email: lead.email,
    name: `${lead.firstName} ${lead.lastName}`.trim() || lead.email,
  };
}
