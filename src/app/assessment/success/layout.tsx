import type { Metadata } from "next";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata: Metadata = buildNeuronourishMetadata("assessmentSuccess");

export default function AssessmentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
