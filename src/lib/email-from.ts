import { runtimeEnv } from "@/lib/runtime-env";

export const CLIENT_EMAIL = "daniel@bridgingloansbroker.co.uk";

/** Personal from-address — better inbox placement than generic hello@ for finance enquiries. */
export function resendFromAddress(): string {
  return runtimeEnv("RESEND_FROM") ?? `Daniel Mehrnia <${CLIENT_EMAIL}>`;
}

export function resendReplyTo(): string {
  return CLIENT_EMAIL;
}
