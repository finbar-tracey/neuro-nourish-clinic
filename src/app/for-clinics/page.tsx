import { ForClinicsPage } from "@/components/landing/for-clinics-page";
import { HEALTHCARE_B2B_METADATA } from "@/lib/healthcare-lp-copy";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: HEALTHCARE_B2B_METADATA.title,
  description: HEALTHCARE_B2B_METADATA.description,
  path: "/for-clinics",
  ogImage: HEALTHCARE_B2B_METADATA.ogImage,
});

export default function ForClinicsRoute() {
  return <ForClinicsPage />;
}
