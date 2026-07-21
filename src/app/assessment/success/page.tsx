import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ leadId?: string; session_id?: string }>;
};

export default async function AssessmentSuccessRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = new URLSearchParams({ product: "cognitive-assessment" });
  if (params.leadId) q.set("leadId", params.leadId);
  if (params.session_id) q.set("session_id", params.session_id);
  redirect(`/shop/success?${q.toString()}`);
}
