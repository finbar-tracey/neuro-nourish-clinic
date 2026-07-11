import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo";
import { brandName } from "@/lib/vertical-config";

export const metadata: Metadata = {
  title: `Workspace | ${brandName()}`,
  description: "Private CRM workspace.",
  robots: NOINDEX_ROBOTS,
  manifest: "/workspace.webmanifest",
  appleWebApp: {
    capable: true,
    title: `${brandName()} Workspace`,
    statusBarStyle: "black-translucent",
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-md:[&_input]:text-base max-md:[&_select]:text-base max-md:[&_textarea]:text-base">
      {children}
    </div>
  );
}
