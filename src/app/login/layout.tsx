import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo";

/** Patient auth surfaces must not appear in organic search (Screaming Frog Directives). */
export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
  title: "Sign in | NeuroNourish",
  description: "Secure patient sign-in for NeuroNourish care portal.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
