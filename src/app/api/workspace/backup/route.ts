import { NextRequest, NextResponse } from "next/server";

import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import {
  buildCrmBackupFileFromStore,
  buildLeadsCsv,
  CRM_BACKUP_VERSION,
} from "@/lib/crm-backup";
import { getCrmBackupMeta, updateCrmBackupMeta, type CrmStoreWithBackup } from "@/lib/crm-backup-meta";
import { readCrmStore } from "@/lib/crm-persistence";
import { notificationsDryRun } from "@/lib/notifications-config";

const MANUAL_BACKUP_COOLDOWN_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const format = request.nextUrl.searchParams.get("format");
  const store = (await readCrmStore()) as CrmStoreWithBackup;
  const meta = getCrmBackupMeta(store);
  const now = Date.now();

  if (!notificationsDryRun() && meta.lastManualBackupAt) {
    const last = new Date(meta.lastManualBackupAt).getTime();
    if (now - last < MANUAL_BACKUP_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Manual backup rate limit — try again in an hour" },
        { status: 429 },
      );
    }
  }

  const dateLabel = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csv = buildLeadsCsv(store.leads);
    if (!notificationsDryRun()) {
      await updateCrmBackupMeta({ lastManualBackupAt: new Date().toISOString() });
    }
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="crm-leads-${dateLabel}.csv"`,
      },
    });
  }

  const file = await buildCrmBackupFileFromStore();
  if (!notificationsDryRun()) {
    await updateCrmBackupMeta({ lastManualBackupAt: new Date().toISOString() });
  }

  return new NextResponse(JSON.stringify(file, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="crm-backup-${dateLabel}.json"`,
      "X-CRM-Backup-Version": CRM_BACKUP_VERSION,
      "X-CRM-Backup-Checksum": file.checksumSha256,
    },
  });
}
