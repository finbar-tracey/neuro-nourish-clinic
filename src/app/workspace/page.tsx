import { WorkspaceShell } from "@/components/workspace/shell";
import { OperationalHome } from "@/components/workspace/operational-home";

export default function WorkspacePage() {
  return (
    <WorkspaceShell>
      <OperationalHome />
    </WorkspaceShell>
  );
}
