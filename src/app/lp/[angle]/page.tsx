import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FacebookLandingPage } from "@/components/landing/fb-landing-page";
import { AD_ANGLES, parseAdAngle, type AdAngle } from "@/lib/ad-angles";
import { metaLpAngleMetadata } from "@/lib/meta-lp-copy";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ angle: string }> };

export async function generateStaticParams() {
  return ["auction", "development", "chain", "refurb"].map((angle) => ({ angle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { angle: raw } = await params;
  const angle = parseAdAngle(raw);
  const { title, description } = metaLpAngleMetadata(angle);
  return buildPageMetadata({
    title,
    description,
    path: `/lp/${raw}`,
  });
}

export default async function AngleLpPage({ params }: Props) {
  const { angle: raw } = await params;
  if (raw !== "default" && !(raw in AD_ANGLES)) notFound();
  const angle = raw as AdAngle;

  return <FacebookLandingPage angle={angle} />;
}
