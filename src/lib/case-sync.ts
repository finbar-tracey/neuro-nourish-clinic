import { db } from "@/lib/db";
import { syncCaseState } from "@/lib/case-engine";

const TERMINAL_STAGES = new Set(["LOST", "COMPLETED", "DISQUALIFIED"]);

export async function syncAllActiveCases() {
  const leads = await db.lead.findMany();
  let synced = 0;

  for (const lead of leads) {
    if (lead.status === "LOST" || lead.status === "WON" || lead.status === "DISQUALIFIED") {
      continue;
    }
    if (lead.caseStage && TERMINAL_STAGES.has(lead.caseStage)) {
      continue;
    }
    await syncCaseState(lead);
    synced++;
  }

  return { synced };
}
