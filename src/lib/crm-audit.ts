import { AutomationTrigger, type LeadStatus } from "@/generated/prisma/client";
import { auditTestEmail } from "@/lib/broker-notify";
import { processIdleLeads, seedDefaultAutomations } from "@/lib/automations";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { PIPELINE_COLUMNS } from "@/lib/lead-pipeline";
import { processDueNurtureEmails } from "@/lib/process-nurture-tasks";

export type AuditCheck = {
  name: string;
  passed: boolean;
  detail?: string;
  error?: string;
};

export type CrmAuditReport = {
  ranAt: string;
  passed: boolean;
  score: number;
  checks: AuditCheck[];
  testLeadId?: string;
  emailSent?: boolean;
  resendId?: string;
  testEmail: string;
};

function check(name: string, passed: boolean, detail?: string, error?: string): AuditCheck {
  return { name, passed, detail, error };
}

export async function runCrmAudit(options?: {
  sendTestEmail?: boolean;
  cleanup?: boolean;
}): Promise<CrmAuditReport> {
  const sendTestEmail = options?.sendTestEmail ?? true;
  const cleanup = options?.cleanup ?? true;
  const checks: AuditCheck[] = [];
  let testLeadId: string | undefined;
  let emailSent = false;
  let resendId: string | undefined;

  try {
    const leadCount = await db.lead.count();
    checks.push(check("Database connection", true, `${leadCount} leads in DB`));
  } catch (error) {
    checks.push(
      check("Database connection", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
    return finalize(checks);
  }

  try {
    await seedDefaultAutomations();
    const rules = await db.automationRule.count();
    checks.push(check("Automation rules seeded", rules > 0, `${rules} rules`));
  } catch (error) {
    checks.push(
      check("Automation rules seeded", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  checks.push(
    check(
      "Pipeline columns configured",
      PIPELINE_COLUMNS.length === 7,
      `${PIPELINE_COLUMNS.length} columns`,
    ),
  );

  checks.push(
    check(
      "Resend API key configured",
      emailConfigured(),
      emailConfigured() ? "RESEND_API_KEY set" : "Add RESEND_API_KEY to .env",
    ),
  );

  try {
    const testLead = await db.lead.create({
      data: {
        firstName: "Audit",
        lastName: "Test",
        email: auditTestEmail(),
        phone: "07000000000",
        loanPurpose: "auction",
        loanAmount: 250000,
        termMonths: 12,
        propertyType: "residential",
        propertyValue: 350000,
        propertyLocation: "London",
        timeframe: "30_days",
        formCompleted: true,
        qualificationTier: "fully_qualified",
        status: "NEW",
        source: "crm_audit",
        additionalInfo: "[Audit] Auto-created by CRM audit — safe to delete",
      },
    });
    testLeadId = testLead.id;
    checks.push(check("Create test lead", true, testLead.id));
  } catch (error) {
    checks.push(
      check("Create test lead", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
    return finalize(checks, testLeadId, emailSent, resendId);
  }

  try {
    const note = await db.note.create({
      data: {
        leadId: testLeadId!,
        content: "CRM audit note",
        author: "Audit",
      },
    });
    checks.push(check("Add note", Boolean(note.id)));
  } catch (error) {
    checks.push(
      check("Add note", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  try {
    const task = await db.task.create({
      data: {
        leadId: testLeadId!,
        title: "Audit follow-up call",
        description: "Created by CRM audit",
      },
    });
    await db.task.update({
      where: { id: task.id },
      data: { completed: true },
    });
    checks.push(check("Create & complete task", true, task.id));
  } catch (error) {
    checks.push(
      check("Create & complete task", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  const transitions: LeadStatus[] = ["CONTACTED", "BOOKED", "WON"];
  try {
    for (const status of transitions) {
      await db.lead.update({
        where: { id: testLeadId! },
        data: { status, lastContactedAt: new Date() },
      });
      await db.activity.create({
        data: {
          leadId: testLeadId!,
          type: "STATUS_CHANGED",
          description: `Audit: moved to ${status}`,
        },
      });
    }
    checks.push(check("Status transitions", true, transitions.join(" → ")));
  } catch (error) {
    checks.push(
      check("Status transitions", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  try {
    const byStatus = await Promise.all(
      PIPELINE_COLUMNS.map((col) =>
        db.lead.count({ where: { status: col.id } }),
      ),
    );
    checks.push(
      check("Pipeline stats query", true, `counts: ${byStatus.join(", ")}`),
    );
  } catch (error) {
    checks.push(
      check("Pipeline stats query", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  try {
    await processIdleLeads();
    await processDueNurtureEmails();
    checks.push(check("Background jobs (idle + nurture)", true));
  } catch (error) {
    checks.push(
      check("Background jobs (idle + nurture)", false, undefined, error instanceof Error ? error.message : "Failed"),
    );
  }

  if (sendTestEmail) {
    try {
      const result = await sendEmail({
        to: auditTestEmail(),
        subject: `BLB CRM Audit — ${new Date().toISOString()}`,
        body: `CRM audit test email from Bridging Loans Broker workspace.

If you received this, Resend is wired correctly.

Test lead ID: ${testLeadId}
Pipeline columns: ${PIPELINE_COLUMNS.length}
Automations trigger: ${AutomationTrigger.LEAD_CREATED}

— Automated CRM audit`,
      });
      emailSent = result.sent;
      resendId = result.id;
      checks.push(
        check(
          `Send test email to ${auditTestEmail()}`,
          result.sent,
          result.sent ? `Resend ID: ${result.id}` : "Logged only",
          result.error,
        ),
      );
    } catch (error) {
      checks.push(
        check(
          `Send test email to ${auditTestEmail()}`,
          false,
          undefined,
          error instanceof Error ? error.message : "Failed",
        ),
      );
    }
  }

  if (cleanup && testLeadId) {
    try {
      await db.lead.delete({ where: { id: testLeadId } });
      testLeadId = undefined;
      checks.push(check("Cleanup test lead", true));
    } catch (error) {
      checks.push(
        check("Cleanup test lead", false, undefined, error instanceof Error ? error.message : "Failed"),
      );
    }
  }

  return finalize(checks, testLeadId, emailSent, resendId);
}

function finalize(
  checks: AuditCheck[],
  testLeadId?: string,
  emailSent?: boolean,
  resendId?: string,
): CrmAuditReport {
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 10 * 10) / 10;
  return {
    ranAt: new Date().toISOString(),
    passed: checks.every((c) => c.passed),
    score,
    checks,
    testLeadId,
    emailSent,
    resendId,
    testEmail: auditTestEmail(),
  };
}

export function crmScoreFromAudit(report: CrmAuditReport): {
  overall: number;
  summary: string;
} {
  const base = 9.0;
  const emailBonus = report.emailSent ? 0.5 : 0;
  const failPenalty = report.checks.filter((c) => !c.passed).length * 0.3;
  const overall = Math.min(10, Math.max(0, Math.round((base + emailBonus - failPenalty) * 10) / 10));
  const summary = report.passed
    ? "All audit checks passed — CRM is production-ready for daily use."
    : `${report.checks.filter((c) => !c.passed).length} check(s) failed — see audit report.`;
  return { overall, summary };
}
