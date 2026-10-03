import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { brandName, isNeuronourish } from "@/lib/vertical-config";

/** Paid / conversion subdomain — exclude from organic index (Screaming Frog Directives). */
export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

/** NeuroNourish marketing site — indexable for organic + brand search. */
export const INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
  },
};

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const path = input.path ?? "/";
  const canonical = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImagePath = input.ogImage ?? (isNeuronourish() ? "/opengraph-image" : undefined);
  const ogImage = ogImagePath
    ? `${siteUrl}${ogImagePath.startsWith("/") ? ogImagePath : `/${ogImagePath}`}`
    : undefined;

  return {
    title: input.title,
    description: input.description,
    robots: isNeuronourish() ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: brandName(),
      locale: "en_GB",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
