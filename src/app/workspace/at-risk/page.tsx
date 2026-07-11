import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function AtRiskQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="at-risk" />
    </WorkspaceShell>
  );
}
