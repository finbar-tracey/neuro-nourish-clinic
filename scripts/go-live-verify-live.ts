#!/usr/bin/env npx tsx
/**
 * Live production integration check — hits /api/health/go-live on the deployed server.
 *
 * Run: npm run go-live:verify-live
 *      GO_LIVE_VERIFY_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run go-live:verify-live
 */
const baseUrl = (
  process.env.GO_LIVE_VERIFY_BASE_URL ??
  process.env.CRM_GO_LIVE_BASE_URL ??
  "https://loans.bridgingloansbroker.co.uk"
).replace(/\/$/, "");

type Health = {
  ok?: boolean;
  issues?: string[];
  dryRun?: boolean;
  metaCapiDryRun?: boolean;
  resendAuthOk?: boolean;
  vonageAuthOk?: boolean;
  kvOk?: boolean;
  blobConfigured?: boolean;
  graphConfigured?: boolean;
  graphAuthOk?: boolean | null;
  metaCapiConfigured?: boolean;
  workspaceSecretSet?: boolean;
  cronSecretSet?: boolean;
  brokerNotifyPhone?: string;
  brokerNotifyEmail?: string;
};

async function main() {
  console.log(`\n🔍 Live go-live verification — ${baseUrl}\n`);

  const res = await fetch(`${baseUrl}/api/health/go-live`, {
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    console.log(`❌ Health endpoint HTTP ${res.status}`);
    process.exit(1);
  }

  const health = (await res.json()) as Health;

  const rows: Array<[string, boolean | null | undefined, string?]> = [
    ["Notifications live (dry-run off)", health.dryRun === false],
    ["Resend auth", health.resendAuthOk],
    ["Vonage auth", health.vonageAuthOk],
    ["KV / CRM persistence", health.kvOk],
    ["Blob storage", health.blobConfigured],
    [
      "Microsoft Graph",
      health.graphConfigured ? health.graphAuthOk === true : true,
      health.graphConfigured ? "configured" : "not configured (optional)",
    ],
    ["Meta CAPI configured", health.metaCapiConfigured],
    ["Meta CAPI live", health.metaCapiDryRun === false],
    ["Workspace secret", health.workspaceSecretSet],
    ["Cron secret", health.cronSecretSet],
    [
      "Broker SMS phone",
      health.brokerNotifyPhone === "+447445160345",
      health.brokerNotifyPhone,
    ],
    [
      "Broker email",
      health.brokerNotifyEmail === "daniel@bridgingloansbroker.co.uk",
      health.brokerNotifyEmail,
    ],
  ];

  for (const [label, pass, detail] of rows) {
    const icon = pass ? "✅" : "❌";
    console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  }

  if (health.issues?.length) {
    console.log("\nIssues:");
    for (const issue of health.issues) {
      console.log(`  • ${issue}`);
    }
  }

  console.log(health.ok ? "\n✅ Production ready for go-live.\n" : "\n❌ Fix issues above before go-live.\n");
  process.exit(health.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
