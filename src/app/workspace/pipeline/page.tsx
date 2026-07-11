import { redirect } from "next/navigation";

/** Legacy kanban pipeline — redirect to case queues. */
export default function PipelinePage() {
  redirect("/workspace/inbox");
}
