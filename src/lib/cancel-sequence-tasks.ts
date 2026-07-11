import { db } from "@/lib/db";
import { isNurtureTaskTitle, isWinbackSequenceTask } from "@/lib/automation-task-meta";

/** Complete pending nurture and win-back tasks so only one sequence runs at a time. */
export async function cancelNurtureAndWinbackTasks(leadId: string) {
  const open = await db.task.findMany({
    where: { leadId, completed: false },
  });

  const toCancel = open.filter(
    (t) => isNurtureTaskTitle(t.title) || isWinbackSequenceTask(t.title),
  );

  for (const task of toCancel) {
    await db.task.update({
      where: { id: task.id },
      data: { completed: true },
    });
  }

  return toCancel.length;
}

export async function cancelWinbackTasks(leadId: string) {
  const open = await db.task.findMany({
    where: { leadId, completed: false },
  });

  const toCancel = open.filter((t) => isWinbackSequenceTask(t.title));

  for (const task of toCancel) {
    await db.task.update({
      where: { id: task.id },
      data: { completed: true },
    });
  }

  return toCancel.length;
}

export async function cancelSequenceTasksByPrefix(leadId: string, prefix: string) {
  await db.task.updateMany({
    where: {
      leadId,
      completed: false,
      title: { startsWith: prefix },
    },
    data: { completed: true },
  });
}
