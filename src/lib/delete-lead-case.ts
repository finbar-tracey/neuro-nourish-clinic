import fs from "node:fs/promises";
import path from "node:path";

import { db } from "@/lib/db";

/** Permanently removes a lead/case and all related CRM data (notes, tasks, documents metadata, etc.). */
export async function deleteLeadCase(leadId: string): Promise<void> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new Error("Lead not found");
  }

  await db.lead.delete({ where: { id: leadId } });

  const uploadDir = path.join(process.cwd(), ".case-uploads", leadId);
  await fs.rm(uploadDir, { recursive: true, force: true }).catch(() => {});
}
