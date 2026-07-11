import { FacebookLandingPage } from "@/components/landing/fb-landing-page";
import { META_LP_METADATA } from "@/lib/meta-lp-copy";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: META_LP_METADATA.title,
  description: META_LP_METADATA.description,
  path: "/lp",
});

export default function FacebookLpPage() {
  return <FacebookLandingPage />;
}
