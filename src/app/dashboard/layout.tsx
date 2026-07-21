import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
  title: "Care dashboard | NeuroNourish",
  description: "Your NeuroNourish care dashboard.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
