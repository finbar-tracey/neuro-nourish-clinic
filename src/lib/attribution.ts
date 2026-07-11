import type { Lead } from "@/generated/prisma/client";

export type AttributionChannel =
  | "Meta"
  | "Google Ads"
  | "Organic"
  | "Referral"
  | "Direct"
  | "Facebook LP"
  | "Other";

export function resolveAttributionChannel(lead: {
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
}): AttributionChannel {
  const utm = (lead.utmSource ?? "").toLowerCase();
  const medium = (lead.utmMedium ?? "").toLowerCase();
  const source = (lead.source ?? "").toLowerCase();

  if (lead.fbclid || utm.includes("facebook") || utm.includes("meta") || utm.includes("instagram")) {
    return "Meta";
  }
  if (
    lead.gclid ||
    utm.includes("google") ||
    medium.includes("cpc") ||
    medium.includes("ppc") ||
    utm.includes("gclid")
  ) {
    return "Google Ads";
  }
  if (utm.includes("referral") || medium.includes("referral")) {
    return "Referral";
  }
  if (source === "facebook_lp") {
    return "Facebook LP";
  }
  if (utm.includes("organic") || medium.includes("organic")) {
    return "Organic";
  }
  if (!utm && !lead.fbclid && (source === "landing_page" || source === "")) {
    return "Direct";
  }
  return "Other";
}

export const ATTRIBUTION_CHANNELS: AttributionChannel[] = [
  "Meta",
  "Google Ads",
  "Facebook LP",
  "Organic",
  "Referral",
  "Direct",
  "Other",
];
