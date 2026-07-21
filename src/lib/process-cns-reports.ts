import { db } from "@/lib/db";
import {
  markCnsPollExpired,
  processCnsReportForLead,
} from "@/lib/cns-pipeline";
import { cnsVsConfigured, isCnsVsLive } from "@/lib/cnsvitalsigns";

/**
 * Poll CNSVS for completed reports on leads awaiting results.
 * Intended for the 15-minute cron.
 */
export async function processDueCnsReportPolls(): Promise<{
  checked: number;
  found: number;
  expired: number;
  errors: number;
}> {
  if (!isCnsVsLive() || !cnsVsConfigured()) {
    return { checked: 0, found: 0, expired: 0, errors: 0 };
  }

  const leads = await db.lead.findMany({
    where: {
      cnsStatus: "awaiting_report",
    },
  });

  let found = 0;
  let expired = 0;
  let errors = 0;
  const now = Date.now();

  for (const lead of leads) {
    const windowEnd = lead.creditExpiryDate
      ? new Date(lead.creditExpiryDate).getTime()
      : lead.assessmentPaidAt
        ? new Date(lead.assessmentPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000
        : null;

    if (windowEnd && now > windowEnd) {
      await markCnsPollExpired(lead);
      expired += 1;
      continue;
    }

    try {
      const result = await processCnsReportForLead(lead);
      if (result.found) found += 1;
    } catch {
      errors += 1;
      await db.lead.update({
        where: { id: lead.id },
        data: {
          cnsLastPolledAt: new Date(),
          cnsPollAttempts: (lead.cnsPollAttempts ?? 0) + 1,
          cnsLastError: "Poll cycle error — will retry",
        },
      });
    }
  }

  return { checked: leads.length, found, expired, errors };
}
