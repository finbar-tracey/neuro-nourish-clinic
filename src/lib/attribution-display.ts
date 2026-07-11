import type { Lead } from "@/generated/prisma/client";

export type LeadAttributionFields = Pick<
  Lead,
  | "source"
  | "attributionChannel"
  | "utmSource"
  | "utmMedium"
  | "utmCampaign"
  | "utmContent"
  | "utmTerm"
  | "fbclid"
  | "gclid"
  | "landingPageUrl"
  | "referrer"
  | "deviceType"
  | "additionalInfo"
>;

const AD_ANGLE_RE = /\[Ad angle:\s*([^\]]+)\]/i;

export function parseAdAngle(additionalInfo?: string | null): string | null {
  if (!additionalInfo) return null;
  const match = additionalInfo.match(AD_ANGLE_RE);
  return match?.[1]?.trim() ?? null;
}

export function formatSourceLabel(source?: string | null): string {
  if (!source) return "Unknown";
  if (source === "facebook_lp") return "Facebook landing page";
  return source.replace(/_/g, " ");
}

export function landingPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    return path === "/" ? "/lp" : path;
  } catch {
    const stripped = url.split("?")[0]?.split("#")[0];
    if (!stripped) return null;
    try {
      return new URL(stripped).pathname;
    } catch {
      return stripped;
    }
  }
}

export function channelBadgeClass(channel?: string | null): string {
  switch (channel) {
    case "Meta":
    case "Facebook LP":
      return "bg-blue-100 text-blue-800";
    case "Google Ads":
      return "bg-emerald-100 text-emerald-800";
    case "Organic":
      return "bg-teal-100 text-teal-800";
    case "Referral":
      return "bg-violet-100 text-violet-800";
    case "Direct":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-100 text-amber-900";
  }
}

/** One-line source summary for case cards and list rows. */
export function attributionSummary(lead: LeadAttributionFields): string {
  const channel = lead.attributionChannel ?? lead.utmSource ?? formatSourceLabel(lead.source);
  const angle = parseAdAngle(lead.additionalInfo);
  const campaign = lead.utmCampaign;
  const parts = [channel];
  if (angle) parts.push(angle.toUpperCase());
  else if (campaign) parts.push(campaign);
  if (lead.deviceType) parts.push(lead.deviceType);
  return parts.filter(Boolean).join(" · ");
}

export function hasAttributionData(lead: LeadAttributionFields): boolean {
  return Boolean(
    lead.source ||
      lead.attributionChannel ||
      lead.utmSource ||
      lead.utmCampaign ||
      lead.fbclid ||
      lead.gclid ||
      lead.landingPageUrl ||
      lead.referrer ||
      lead.deviceType ||
      parseAdAngle(lead.additionalInfo),
  );
}

export function truncateId(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
