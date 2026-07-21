import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ leadId?: string; score?: string }>;
};

/** Legacy assessment URL → shop product */
export default async function AssessmentRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.leadId) q.set("leadId", params.leadId);
  if (params.score) q.set("score", params.score);
  const qs = q.toString();
  redirect(`/shop/cognitive-assessment${qs ? `?${qs}` : ""}`);
}
