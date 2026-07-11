import type { Metadata } from "next";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata: Metadata = buildNeuronourishMetadata("programmeSuccess");

export default function ProgrammeSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
