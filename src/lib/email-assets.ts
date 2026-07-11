const PRODUCTION_SITE = "https://loans.bridgingloansbroker.co.uk";

/** Canonical origin for images linked in outbound email (always the public LP domain). */
export function emailAssetOrigin(): string {
  return PRODUCTION_SITE;
}

export function emailAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${emailAssetOrigin()}${normalized}`;
}

export function emailLogoUrl(): string {
  return emailAssetUrl("/logo.png");
}

/** JPEG — supported by Gmail, Outlook, and Apple Mail (WebP/data URIs often break). */
export function emailDanielPhotoUrl(): string {
  return emailAssetUrl("/daniel-mehrnia.jpg");
}
