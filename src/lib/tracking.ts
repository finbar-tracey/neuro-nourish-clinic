import { ensureMetaClickCookie } from "@/lib/meta-tracking";

export type TrackingParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  landingPageUrl?: string;
  referrer?: string;
  deviceType?: string;
  source?: string;
};

const TRACKING_STORAGE_KEY = "nn-attribution";

function detectDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function loadPersistedTracking(): TrackingParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: TrackingParams = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) {
        (clean as Record<string, string>)[key] = value;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function persistTrackingParams(params: TrackingParams) {
  if (typeof window === "undefined") return;
  const merged = { ...loadPersistedTracking(), ...params };
  sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(merged));
}

/** Map paid social UTMs to a CRM-friendly source label. */
export function resolveCampaignSource(params: TrackingParams, fallback?: string): string | undefined {
  if (params.source) return params.source;
  if (params.utmCampaign) return `meta:${params.utmCampaign}`;
  if (params.fbclid || params.utmSource?.toLowerCase().includes("meta")) {
    return "meta_paid_social";
  }
  return fallback;
}

export function captureTrackingFromUrl(): TrackingParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") ?? undefined;
  ensureMetaClickCookie(fbclid);

  const fromUrl: TrackingParams = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    fbclid,
    gclid: params.get("gclid") ?? undefined,
    landingPageUrl: window.location.href,
    referrer: document.referrer || undefined,
    deviceType: detectDeviceType(),
    source: resolveCampaignSource({
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      fbclid: fbclid ?? undefined,
    }),
  };

  const merged = { ...loadPersistedTracking(), ...fromUrl };
  persistTrackingParams(merged);
  return merged;
}

export function trackMetaEvent(
  event: "Lead" | "ViewContent" | "Contact" | "InitiateCheckout" | "Schedule",
  data?: Record<string, unknown>,
  options?: { eventId?: string },
) {
  if (typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (!fbq) return;
  if (options?.eventId) {
    fbq("track", event, data ?? {}, { eventID: options.eventId });
    return;
  }
  fbq("track", event, data);
}
