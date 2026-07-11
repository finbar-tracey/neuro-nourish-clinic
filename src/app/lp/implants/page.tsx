import { HealthcareLandingPage } from "@/components/landing/healthcare-landing-page";
import { HEALTHCARE_IMPLANTS_METADATA } from "@/lib/healthcare-lp-copy";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: HEALTHCARE_IMPLANTS_METADATA.title,
  description: HEALTHCARE_IMPLANTS_METADATA.description,
  path: "/lp/implants",
  ogImage: HEALTHCARE_IMPLANTS_METADATA.ogImage,
});

export default function HealthcareImplantsLpPage() {
  return <HealthcareLandingPage />;
}
