import { NeuroNourishHomePage } from "@/components/neuronourish/home-page";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildNeuronourishMetadata("home");
}

export default function HomePage() {
  return <NeuroNourishHomePage />;
}
