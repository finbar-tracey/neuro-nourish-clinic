/** When true, SMS/email helpers log only — no outbound API calls (tests, local dev). */
export function notificationsDryRun(): boolean {
  return process.env.NOTIFICATIONS_DRY_RUN === "true";
}
