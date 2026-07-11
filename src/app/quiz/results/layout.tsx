import type { Metadata } from "next";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata: Metadata = buildNeuronourishMetadata("quizResults");

export default function QuizResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
