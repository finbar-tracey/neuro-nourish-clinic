import { NextRequest, NextResponse } from "next/server";
import { processIdleLeads } from "@/lib/automations";
import { syncAllActiveCases } from "@/lib/case-sync";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { processDueNeuronourishNurtureEmails } from "@/lib/process-neuronourish-nurture";
import { processDueNurtureEmails } from "@/lib/process-nurture-tasks";
import { processDueWinbackEmails } from "@/lib/process-winback-tasks";
import { processOperationalFollowUps } from "@/lib/process-operational";
import { processNotificationRetries } from "@/lib/notification-retry";
import { processWeeklySourceDigest } from "@/lib/weekly-source-digest";
import { processWeeklyWinbackDigest } from "@/lib/weekly-winback-digest";
import { processWeeklyCrmBackup } from "@/lib/weekly-crm-backup";
import { processDueCnsReportPolls } from "@/lib/process-cns-reports";

export async function POST(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const [
    idle,
    nurture,
    nnNurture,
    winback,
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
    operational,
    caseSync,
    retries,
    weeklyDigest,
    winbackDigest,
    crmBackup,
    cnsReports,
  });
}
