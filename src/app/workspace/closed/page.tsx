import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function ClosedCasesQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="closed" />
    </WorkspaceShell>
  );
}
