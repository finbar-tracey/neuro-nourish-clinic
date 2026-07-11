import { InboxBoard } from "@/components/workspace/inbox-board";
import { WorkspaceShell } from "@/components/workspace/shell";

export default function InboxPage() {
  return (
    <WorkspaceShell>
      <InboxBoard />
    </WorkspaceShell>
  );
}
