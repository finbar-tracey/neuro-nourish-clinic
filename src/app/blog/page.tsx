import { redirect } from "next/navigation";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

/** Blog is not live yet — keep route for staging/internal, but do not ship as a public marketing surface. */
export const metadata = buildNeuronourishMetadata("blog");

export default function BlogPage() {
  redirect("/");
}
