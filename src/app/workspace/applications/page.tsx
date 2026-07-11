import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function ApplicationsQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="applications" />
    </WorkspaceShell>
  );
}
