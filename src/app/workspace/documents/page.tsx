import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function DocumentsQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="documents" />
    </WorkspaceShell>
  );
}
