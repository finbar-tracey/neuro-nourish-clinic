export type MetaBrowserIds = {
  fbp?: string;
  fbc?: string;
};

const FBC_MAX_AGE_DAYS = 90;

export function readMetaBrowserIds(): MetaBrowserIds {
  if (typeof document === "undefined") return {};

  const match = (name: string) => {
    const row = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    return row?.slice(name.length + 1);
  };

  return {
    fbp: match("_fbp"),
    fbc: match("_fbc"),
  };
}

/** Persist Meta click id cookie when fbclid is in the landing URL (improves CAPI match). */
export function ensureMetaClickCookie(fbclid?: string): void {
  if (typeof document === "undefined" || !fbclid) return;
  const existing = readMetaBrowserIds().fbc;
  if (existing?.includes(fbclid)) return;

  const created = Math.floor(Date.now() / 1000);
  const value = `fb.1.${created}.${fbclid}`;
  const maxAge = FBC_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `_fbc=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Core setup strips query strings — send origin + path only for event_source_url. */
export function sanitizeMetaEventUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0]?.split("#")[0];
  }
}

export function metaEventId(prefix: string, id?: string): string {
  if (id) return `${prefix}-${id}`;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function metaTrackingPayload(eventId: string) {
  return {
    ...readMetaBrowserIds(),
    metaEventId: eventId,
  };
}

/** Browser Pixel Lead + CompleteRegistration on quiz finish (deduped with CAPI via eventID). */
export function fireClientMetaQuizCompleteEvents(leadId: string, score: number, eventId: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (!fbq) return;

  const qualification = score >= 75 ? "highly_qualified" : "nurture";

  fbq(
    "track",
    "Lead",
    {
      content_name: "Brain Health Assessment Quiz",
      content_category: "Diagnostic Assessment",
      value: 0,
      currency: "EUR",
      predicted_qualification: qualification,
    },
    { eventID: eventId },
  );

  fbq(
    "track",
    "CompleteRegistration",
    {
      status: "quiz_completed",
      content_ids: [leadId],
    },
    { eventID: `${eventId}-registration` },
  );
}

export type MetaCheckoutTier = "assessment" | "programme";

export function metaInitiateCheckoutEventId(tier: MetaCheckoutTier, leadId: string): string {
  return metaEventId(`checkout-${tier}`, leadId);
}

export function metaPurchaseEventId(leadId: string, valueEur: number): string {
  return `purchase-${leadId}-${Math.round(valueEur * 100)}`;
}

/** Browser Pixel InitiateCheckout before Stripe redirect (dedupe with CAPI via eventID). */
export function fireMetaInitiateCheckoutEvent(
  tier: MetaCheckoutTier,
  value: number,
  leadId: string,
) {
  if (typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (!fbq) return;

  const eventId = metaInitiateCheckoutEventId(tier, leadId);
  const contentName =
    tier === "programme"
      ? "12-Month Personalised Brain Health Programme"
      : "Scientific Cognitive Baseline Assessment";

  fbq(
    "track",
    "InitiateCheckout",
    {
      content_name: contentName,
      content_category: "Premium Care Pathway",
      value,
      currency: "EUR",
      content_ids: [leadId],
    },
    { eventID: eventId },
  );
}

/** Shape for server-side Purchase CAPI dispatch (email hashed at send time). */
export function buildMetaServerPurchasePayload(leadId: string, value: number, email: string) {
  return {
    event_name: "Purchase" as const,
    event_time: Math.floor(Date.now() / 1000),
    event_id: metaPurchaseEventId(leadId, value),
    user_data: {
      em: email.toLowerCase().trim(),
      external_id: leadId,
    },
    custom_data: {
      value,
      currency: "EUR",
      content_type: "product",
    },
  };
}
