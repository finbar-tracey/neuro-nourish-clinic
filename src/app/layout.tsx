import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { NeuroNourishResourceHints } from "@/components/neuronourish/resource-hints";
import { SkipLink } from "@/components/layout/skip-link";
import { buildPageMetadata } from "@/lib/seo";
import { NN_METADATA } from "@/lib/neuronourish-copy";
import { brandName, isHealthcare, isNeuronourish } from "@/lib/vertical-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
});

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw?.startsWith("http")) return raw;
  if (raw) return `https://${raw}`;
  if (isNeuronourish()) return "https://neuronourish.clinic";
  if (isHealthcare()) return "https://bookedconsult.com";
  return "https://neuronourish.clinic";
}

export async function generateMetadata(): Promise<Metadata> {
  if (isNeuronourish()) {
    return {
      ...buildPageMetadata({
        title: NN_METADATA.title,
        description: NN_METADATA.description,
        path: "/",
      }),
      metadataBase: new URL(siteUrl()),
    };
  }

  if (isHealthcare()) {
    return {
      ...buildPageMetadata({
        title: `${brandName()} | Qualified consultations for clinics`,
        description:
          "Booked implant consultations for private clinics — qualified patients, not leads. Pay per booked consultation.",
        path: "/",
      }),
      metadataBase: new URL(siteUrl()),
    };
  }

  return {
    ...buildPageMetadata({
      title: NN_METADATA.title,
      description: NN_METADATA.description,
      path: "/",
    }),
    metadataBase: new URL(siteUrl()),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A3348",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <NeuroNourishResourceHints />
        <SkipLink />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
