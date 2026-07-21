import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
  title: "Onboarding | NeuroNourish",
  description: "Complete your NeuroNourish programme onboarding.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
