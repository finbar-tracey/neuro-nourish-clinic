import { NextRequest, NextResponse } from "next/server";
import { processIdleLeads } from "@/lib/automations";
import { syncAllActiveCases } from "@/lib/case-sync";
import { verifyCronAuth } from "@/lib/auth";
import { processNotificationRetries } from "@/lib/notification-retry";
import { processDueMetaCompleteChase } from "@/lib/meta-complete-chase";
import { processDueQualifiedBookingChase } from "@/lib/qualified-booking-chase";
import { processDueNeuronourishNurtureEmails } from "@/lib/process-neuronourish-nurture";
import { processDueNurtureEmails } from "@/lib/process-nurture-tasks";
import { processDueWinbackEmails } from "@/lib/process-winback-tasks";
import { processOperationalFollowUps } from "@/lib/process-operational";
import { processWeeklySourceDigest } from "@/lib/weekly-source-digest";
import { processWeeklyWinbackDigest } from "@/lib/weekly-winback-digest";
import { processWeeklyCrmBackup } from "@/lib/weekly-crm-backup";
import { processDueCnsReportPolls } from "@/lib/process-cns-reports";

/** Vercel Cron — runs every 15 minutes. Secured via CRON_SECRET. */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    idle,
    nurture,
    nnNurture,
    winback,
    metaChase,
    bookingChase,
    operational,
    caseSync,
    retries,
    weeklyDigest,
    winbackDigest,
    crmBackup,
    cnsReports,
  ] = await Promise.all([
    processIdleLeads(),
    processDueNurtureEmails(),
    processDueNeuronourishNurtureEmails(),
    processDueWinbackEmails(),
    processDueMetaCompleteChase(),
    processDueQualifiedBookingChase(),
    processOperationalFollowUps(),
    syncAllActiveCases(),
    processNotificationRetries(),
    processWeeklySourceDigest(),
    processWeeklyWinbackDigest(),
    processWeeklyCrmBackup(),
    processDueCnsReportPolls(),
  ]);

  return NextResponse.json({
    ok: true,
    idle,
    nurture,
    nnNurture,
    winback,
    metaChase,
    bookingChase,
    operational,
    caseSync,
    retries,
    weeklyDigest,
    winbackDigest,
    crmBackup,
    cnsReports,
  });
}
