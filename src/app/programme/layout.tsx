import type { Metadata } from "next";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import { isNeuronourish } from "@/lib/vertical-config";

export const metadata: Metadata = isNeuronourish()
  ? buildNeuronourishMetadata("programme")
  : { title: "Programme" };

export default function ProgrammeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
