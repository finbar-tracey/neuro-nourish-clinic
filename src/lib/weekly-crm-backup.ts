import { brokerNotifyEmail } from "@/lib/broker-notify";
import {
  buildCrmBackupAttachments,
  buildCrmBackupEmailBody,
  buildCrmBackupFileFromStore,
} from "@/lib/crm-backup";
import {
  backupLondonParts,
  backupWeekKey,
  getCrmBackupMeta,
  updateCrmBackupMeta,
  type CrmStoreWithBackup,
} from "@/lib/crm-backup-meta";
import { readCrmStore } from "@/lib/crm-persistence";
import { sendEmail } from "@/lib/email";
import { notificationsDryRun } from "@/lib/notifications-config";

function inScheduledWindow(now = new Date()) {
  if (process.env.FORCE_CRM_BACKUP === "true") return true;
  const { weekday, hour, minute } = backupLondonParts(now);
  if (weekday !== "Mon" || hour !== 8) return false;
  return minute >= 15;
}

async function sendFailureAlert(weekKey: string, error: string) {
  if (notificationsDryRun()) return;

  const store = (await readCrmStore()) as CrmStoreWithBackup;
  const meta = getCrmBackupMeta(store);
  if (meta.lastCrmBackupFailureWeekKey === weekKey) return;

  await sendEmail({
    to: brokerNotifyEmail(),
    subject: `CRM backup FAILED — action required — ${weekKey}`,
    body: `The weekly CRM backup did not send.

Error: ${error}

Download a manual full backup from Workspace → Full backup, or run restore prep locally.`,
    category: "transactional",
  });

  await updateCrmBackupMeta({
    lastCrmBackupFailureAt: new Date().toISOString(),
    lastCrmBackupFailureWeekKey: weekKey,
  });
}

/** Monday 08:15 London — full CRM JSON + leads CSV to Daniel. */
export async function processWeeklyCrmBackup() {
  const weekKey = backupWeekKey();

  if (notificationsDryRun()) {
    const file = await buildCrmBackupFileFromStore();
    return {
      sent: false,
      skipped: "dry_run",
      weekKey,
      leadCount: file.summary.leadCount,
      checksum: file.checksumSha256,
    };
  }

  if (!inScheduledWindow()) {
    return { sent: false, skipped: "not_scheduled_window" };
  }

  const store = (await readCrmStore()) as CrmStoreWithBackup;
  const meta = getCrmBackupMeta(store);

  if (meta.lastCrmBackupWeekKey === weekKey && process.env.FORCE_CRM_BACKUP !== "true") {
    return { sent: false, skipped: "already_sent", weekKey };
  }

  try {
    const file = await buildCrmBackupFileFromStore();
    const dateLabel = file.createdAt.slice(0, 10);
    const attachments = buildCrmBackupAttachments(file, dateLabel);
    const checksumShort = file.checksumSha256.slice(0, 8);

    const result = await sendEmail({
      to: brokerNotifyEmail(),
      subject: `CRM weekly backup — ${file.summary.leadCount} leads — ${dateLabel} — sha256:${checksumShort}`,
      body: buildCrmBackupEmailBody(file),
      category: "transactional",
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
    });

    if (!result.sent) {
      const error = result.error ?? "Resend did not send";
      await sendFailureAlert(weekKey, error);
      return { sent: false, error, weekKey };
    }

    await updateCrmBackupMeta({
      lastCrmBackupAt: file.createdAt,
      lastCrmBackupWeekKey: weekKey,
      lastCrmBackupChecksum: file.checksumSha256,
      lastCrmBackupFailureWeekKey: null,
      lastCrmBackupFailureAt: null,
    });

    return {
      sent: true,
      weekKey,
      leadCount: file.summary.leadCount,
      checksum: file.checksumSha256,
      attachments: attachments.map((a) => a.filename),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    await sendFailureAlert(weekKey, message);
    return { sent: false, error: message, weekKey };
  }
}
