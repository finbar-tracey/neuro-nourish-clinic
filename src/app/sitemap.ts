import type { MetadataRoute } from "next";
import { neuronourishPublicPaths } from "@/lib/neuronourish-seo";
import { getSiteUrl } from "@/lib/site-url";
import { isNeuronourish } from "@/lib/vertical-config";

/**
 * NeuroNourish: only indexable marketing URLs (no hash fragments per Screaming Frog guidance).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isNeuronourish()) {
    return [];
  }

  const siteUrl = getSiteUrl();
  const now = new Date();

  return neuronourishPublicPaths().map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/quiz" ? 0.9 : 0.7,
  }));
}
