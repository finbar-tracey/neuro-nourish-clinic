import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { isNeuronourish } from "@/lib/vertical-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  if (isNeuronourish()) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/workspace/",
            "/api/",
            "/lp/",
            "/for-clinics/",
            "/email-preview/",
            "/upload/",
          ],
        },
      ],
      sitemap: `${siteUrl}/sitemap.xml`,
      host: siteUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/workspace/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
