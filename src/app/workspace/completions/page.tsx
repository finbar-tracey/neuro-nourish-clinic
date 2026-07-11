import { WorkspaceShell } from "@/components/workspace/shell";
import { CaseQueueBoard } from "@/components/workspace/case-queue-board";

export default function CompletionsQueuePage() {
  return (
    <WorkspaceShell>
      <CaseQueueBoard queueId="completions" />
    </WorkspaceShell>
  );
}
