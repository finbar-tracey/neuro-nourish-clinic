import type { JourneyEmailId } from "@/lib/journey-emails";

export type CtaExpectation =
  | "absolute"
  | "teams"
  | "upload"
  | "book"
  | "resume"
  | "workspace"
  | "external"
  | "lp";

const INVALID_PATHS = ["/lp/thank-you"];

export function validateCtaHref(
  href: string,
  expectation: CtaExpectation,
): { ok: boolean; reason?: string } {
  if (!href.trim()) {
    return { ok: false, reason: "empty href" };
  }

  for (const bad of INVALID_PATHS) {
    if (href.includes(bad)) {
      return { ok: false, reason: `forbidden path ${bad}` };
    }
  }

  if (href.startsWith("/")) {
    return { ok: false, reason: "relative URL" };
  }

  if (href.includes(":///") || /^https?:\/\/\//.test(href)) {
    return { ok: false, reason: "missing hostname" };
  }

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { ok: false, reason: "malformed URL" };
  }

  if (!url.hostname) {
    return { ok: false, reason: "missing hostname" };
  }

  switch (expectation) {
    case "teams":
      if (!url.hostname.includes("teams.microsoft.com")) {
        return { ok: false, reason: "expected Teams join URL" };
      }
      break;
    case "upload":
      if (!href.includes("/upload/")) {
        return { ok: false, reason: "expected upload token URL" };
      }
      break;
    case "book":
      if (!href.includes("/lp/book?lead=")) {
        return { ok: false, reason: "expected /lp/book?lead=" };
      }
      break;
    case "resume":
      if (!href.includes("/lp?lead=") || !href.includes("step=3")) {
        return { ok: false, reason: "expected resume step 3 URL" };
      }
      break;
    case "workspace":
      if (!href.includes("/workspace/cases/")) {
        return { ok: false, reason: "expected workspace case URL" };
      }
      break;
    case "lp":
      if (!href.endsWith("/lp") && !href.includes("/lp?")) {
        return { ok: false, reason: "expected /lp landing URL" };
      }
      break;
    case "external":
    case "absolute":
      break;
  }

  return { ok: true };
}

/** Expected CTA rules per journey email when built with full sample context. */
export const JOURNEY_CTA_RULES: Partial<
  Record<JourneyEmailId, { required: boolean; expectation: CtaExpectation }>
> = {
  "capture-welcome": { required: true, expectation: "resume" },
  "qualified-confirmation": { required: true, expectation: "book" },
  "priority-call-confirmed": { required: true, expectation: "teams" },
  "booking-reminder": { required: true, expectation: "teams" },
  "document-request": { required: true, expectation: "upload" },
  "document-chase-24h": { required: true, expectation: "upload" },
  "document-chase-48h": { required: true, expectation: "upload" },
  "deal-completed": { required: true, expectation: "external" },
  "nurture-day-30": { required: true, expectation: "lp" },
  "broker-priority-booked": { required: true, expectation: "teams" },
};
