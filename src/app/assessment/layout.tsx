import type { Metadata } from "next";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import { isNeuronourish } from "@/lib/vertical-config";

export const metadata: Metadata = isNeuronourish()
  ? buildNeuronourishMetadata("assessment")
  : { title: "Assessment" };

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
