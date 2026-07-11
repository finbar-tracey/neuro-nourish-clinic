import { NN_META_AD_CAMPAIGN } from "@/lib/neuronourish-copy";
import { getSiteUrl } from "@/lib/site-url";

/** Build a Meta ad destination URL with standard August launch UTM parameters. */
export function buildMetaQuizLandingUrl(angleId: string, baseUrl = getSiteUrl()): string {
  const tracking = NN_META_AD_CAMPAIGN.tracking;
  const params = new URLSearchParams({
    utm_source: "meta",
    utm_medium: tracking.utmMedium,
    utm_campaign: tracking.utmCampaign,
    utm_content: tracking.utmContent.replace("{id}", angleId),
  });

  return `${baseUrl.replace(/\/$/, "")}/quiz?${params.toString()}`;
}

/** All pre-built ad destination URLs keyed by creative angle id. */
export function metaQuizAdDestinationUrls(baseUrl = getSiteUrl()) {
  return {
    "brain-planning-analogy": buildMetaQuizLandingUrl("brain-planning-analogy", baseUrl),
    "daily-vulnerabilities": buildMetaQuizLandingUrl("daily-vulnerabilities", baseUrl),
    "family-history-proactive": buildMetaQuizLandingUrl("family-history-proactive", baseUrl),
  } as const;
}
