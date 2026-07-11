import { NeuroNourishHomePage } from "@/components/neuronourish/home-page";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import { isHealthcare } from "@/lib/vertical-config";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildNeuronourishMetadata("home");
}

export default function HomePage() {
  if (isHealthcare()) {
    redirect("/for-clinics");
  }
  return <NeuroNourishHomePage />;
}
