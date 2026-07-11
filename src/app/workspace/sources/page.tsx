import { WorkspaceShell } from "@/components/workspace/shell";
import { SourcesReport } from "@/components/workspace/sources-report";

export default function SourcesPage() {
  return (
    <WorkspaceShell>
      <SourcesReport />
    </WorkspaceShell>
  );
}
