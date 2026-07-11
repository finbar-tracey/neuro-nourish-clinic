import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function CallbacksQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="callbacks" />
    </WorkspaceShell>
  );
}
