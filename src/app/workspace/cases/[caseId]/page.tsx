import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseDetail } from "@/components/workspace/case-detail";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <WorkspaceShell>
      <CaseDetail caseId={caseId} />
    </WorkspaceShell>
  );
}
