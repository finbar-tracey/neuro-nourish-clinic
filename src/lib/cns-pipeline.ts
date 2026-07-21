import { format, subYears } from "date-fns";
import type { Lead } from "@/generated/prisma/client";
import { logCaseTimeline } from "@/lib/case-engine";
import {
  NN_CNS_SUMMARY_PROMPT,
  NN_CNS_SUMMARY_PROMPT_VERSION,
} from "@/lib/cns-summary-prompt";
import {
  cnsDownloadReportPdf,
  cnsEmailRemoteTest,
  cnsGenerateRemoteTest,
  cnsListReports,
  cnsSubjectIdForLead,
  cnsVsConfigured,
  cnsVsUseEmailRtl,
  isCnsVsLive,
  validateDobForCns,
  type CnsStatus,
} from "@/lib/cnsvitalsigns";
import { db } from "@/lib/db";
import { storeCaseDocument } from "@/lib/document-storage";
import { sendEmail } from "@/lib/email";
import { NN_PRICING } from "@/lib/neuronourish-funnel";
import { sendAssessmentInstructionsEmail } from "@/lib/neuronourish-nurture";
import { sendSlackAlert } from "@/lib/neuronourish-notifications";
import { nnOperationalPatchForStage } from "@/lib/neuronourish-workspace";
import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";
import { siteUrl } from "@/lib/site-url";
import { partnerNotifyEmail } from "@/lib/vertical-config";

async function note(leadId: string, content: string) {
  await db.note.create({
    data: { leadId, author: "System", content },
  });
}

export async function ensureCnsSubjectId(lead: Lead): Promise<string> {
  if (lead.cnsSubjectId) return lead.cnsSubjectId;
  const subjectId = cnsSubjectIdForLead(lead.id);
  await db.lead.update({
    where: { id: lead.id },
    data: { cnsSubjectId: subjectId },
  });
  await note(lead.id, `[CNS] Assigned subject id ${subjectId}`);
  return subjectId;
}

function expiryLabel(lead: Lead): string {
  if (lead.creditExpiryDate) {
    return format(new Date(lead.creditExpiryDate), "dd MMM yyyy");
  }
  const d = new Date();
  d.setDate(d.getDate() + NN_PRICING.assessmentCreditDays);
  return format(d, "dd MMM yyyy");
}

export async function sendCnsUnlockEmail(lead: Lead) {
  const unlockUrl = `${siteUrl()}/shop/cognitive-assessment/unlock?leadId=${encodeURIComponent(lead.id)}`;
  const body = `Hi ${lead.firstName},

Thank you for purchasing your Cognitive Health Assessment.

To issue your CNS Vital Signs test securely, we need your date of birth (used only for age-normed scoring).

Complete this short step to unlock your test:
${unlockUrl}

Your assessment credit window runs until ${expiryLabel(lead)}.

In partnership,
NeuroNourish Clinic`;

  return sendEmail({
    to: lead.email,
    subject: "Unlock your Cognitive Health Assessment",
    body,
    category: "transactional",
    htmlOptions: {
      cta: { label: "Unlock your assessment", href: unlockUrl },
      preheader: "One detail needed before we send your test link",
      showDanielSignature: false,
    },
  });
}

/**
 * Called after assessment payment (or unlock submit).
 * Idempotent: existing cnsRemoteId skips a new rtl unless forceReissue.
 */
export async function issueCnsRemoteTest(
  leadId: string,
  options: { forceReissue?: boolean } = {},
): Promise<{
  ok: boolean;
  status: CnsStatus;
  testUrl?: string;
  error?: string;
}> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, status: "failed", error: "Lead not found" };

  const subjectId = await ensureCnsSubjectId(lead);
  const fresh = (await db.lead.findUnique({ where: { id: leadId } }))!;

  if (fresh.cnsRemoteId && fresh.cnsTestUrl && !options.forceReissue) {
    return {
      ok: true,
      status: (fresh.cnsStatus as CnsStatus) || "awaiting_report",
      testUrl: fresh.cnsTestUrl,
    };
  }

  // Live / credentials before unlock email — avoid promising a test we cannot issue.
  if (!isCnsVsLive()) {
    await db.lead.update({
      where: { id: leadId },
      data: {
        cnsStatus: fresh.dateOfBirth ? "failed" : "pending_dob",
        cnsLastError: "CNSVS_LIVE is off — issue test manually",
        nextAction: fresh.dateOfBirth
          ? "Issue CNS test manually (CNSVS_LIVE off)"
          : "Collect DOB, then enable CNSVS_LIVE / re-issue",
      },
    });
    await note(leadId, "[CNS] CNSVS_LIVE off — payment confirmed; manual test issue required");
    // Still collect DOB once so re-issue works when live is enabled.
    if (!fresh.dateOfBirth && fresh.cnsStatus !== "pending_dob") {
      await sendCnsUnlockEmail(fresh);
      await note(leadId, "[CNS] DOB missing — unlock email sent (live flag off)");
    }
    return { ok: false, status: "failed", error: "CNSVS_LIVE is not enabled" };
  }

  if (!cnsVsConfigured()) {
    await db.lead.update({
      where: { id: leadId },
      data: {
        cnsStatus: fresh.dateOfBirth ? "failed" : "pending_dob",
        cnsLastError: "CNSVS credentials missing",
        nextAction: "Configure CNSVS credentials and re-issue test",
      },
    });
    await note(leadId, "[CNS] Credentials missing — cannot issue rtl");
    if (!fresh.dateOfBirth && fresh.cnsStatus !== "pending_dob") {
      await sendCnsUnlockEmail(fresh);
    }
    void sendSlackAlert("ASSESSMENT_PAID", {
      name: `${fresh.firstName} ${fresh.lastName}`.trim(),
      email: fresh.email,
      extra: `CNS issue failed — credentials missing · ${siteUrl()}/workspace/cases/${leadId}`,
    });
    return { ok: false, status: "failed", error: "CNSVS credentials missing" };
  }

  if (!fresh.dateOfBirth) {
    const alreadyPending = fresh.cnsStatus === "pending_dob";
    await db.lead.update({
      where: { id: leadId },
      data: { cnsStatus: "pending_dob", cnsLastError: null },
    });
    if (!alreadyPending) {
      await sendCnsUnlockEmail(fresh);
      await note(leadId, "[CNS] DOB missing — unlock email sent");
      await logCaseTimeline(leadId, "STAGE_CHANGED", "CNS awaiting date of birth", "System");
    }
    return { ok: true, status: "pending_dob" };
  }

  const dobError = validateDobForCns(new Date(fresh.dateOfBirth));
  if (dobError) {
    await db.lead.update({
      where: { id: leadId },
      data: { cnsStatus: "pending_dob", cnsLastError: dobError },
    });
    return { ok: false, status: "pending_dob", error: dobError };
  }

  try {
    const { testUrl, remoteId } = await cnsGenerateRemoteTest({
      subjectId,
      dateOfBirth: new Date(fresh.dateOfBirth),
    });

    if (cnsVsUseEmailRtl()) {
      try {
        await cnsEmailRemoteTest(remoteId, fresh.email);
      } catch (err) {
        await note(
          leadId,
          `[CNS] email_rtl failed (Resend instructions still sent): ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    }

    await db.lead.update({
      where: { id: leadId },
      data: {
        cnsSubjectId: subjectId,
        cnsRemoteId: remoteId,
        cnsTestUrl: testUrl,
        cnsStatus: "awaiting_report",
        cnsLastError: null,
        cnsPollAttempts: options.forceReissue ? 0 : fresh.cnsPollAttempts,
        nextAction: "Await CNS assessment completion",
      },
    });

    await sendAssessmentInstructionsEmail({
      email: fresh.email,
      firstName: fresh.firstName,
      expiryDateString: expiryLabel(fresh),
      testUrl,
      leadId,
    });

    await note(
      leadId,
      `[CNS] Remote test issued · subject ${subjectId} · remote ${remoteId}${options.forceReissue ? " (re-issue)" : ""}`,
    );
    await logCaseTimeline(leadId, "STAGE_CHANGED", "CNS remote test sent", "System");

    return { ok: true, status: "awaiting_report", testUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "CNS rtl failed";
    await db.lead.update({
      where: { id: leadId },
      data: {
        cnsStatus: "failed",
        cnsLastError: message,
        nextAction: "Retry CNS test issue",
      },
    });
    await note(leadId, `[CNS] rtl failure: ${message}`);
    void sendSlackAlert("ASSESSMENT_PAID", {
      name: `${fresh.firstName} ${fresh.lastName}`.trim(),
      email: fresh.email,
      extra: `CNS rtl failed: ${message} · ${siteUrl()}/workspace/cases/${leadId}`,
    });
    return { ok: false, status: "failed", error: message };
  }
}

async function draftSummaryFromPdf(pdf: Buffer): Promise<string> {
  const apiKey = runtimeSecret("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return `[Draft placeholder — ANTHROPIC_API_KEY not set]\n\nPrompt ${NN_CNS_SUMMARY_PROMPT_VERSION} ready. PDF stored; clinician to review report manually.`;
  }

  const model = runtimeEnv("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514";
  const pdfBase64 = pdf.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2700,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: NN_CNS_SUMMARY_PROMPT },
          ],
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Anthropic HTTP ${response.status}`);
  }

  const text = (payload.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text!)
    .join("\n")
    .trim();

  if (!text) throw new Error("Anthropic returned empty summary");
  return text;
}

async function notifyCareSummaryDraft(lead: Lead, summary: string) {
  const to = partnerNotifyEmail();
  if (!to) return;
  const caseUrl = `${siteUrl()}/workspace/cases/${lead.id}`;
  await sendEmail({
    to,
    subject: `[CNS] Summary draft ready — ${lead.firstName} ${lead.lastName}`,
    body: `A CNS report summary draft is ready for review.\n\nClient: ${lead.firstName} ${lead.lastName}\nEmail: ${lead.email}\nSubject id: ${lead.cnsSubjectId ?? "—"}\nCase: ${caseUrl}\n\n--- Draft (${NN_CNS_SUMMARY_PROMPT_VERSION}) ---\n\n${summary}\n\nApprove & send from the workspace case when ready.`,
    category: "transactional",
    htmlOptions: {
      cta: { label: "Open case", href: caseUrl },
      showDanielSignature: false,
    },
  });
}

export async function processCnsReportForLead(lead: Lead): Promise<{
  found: boolean;
  error?: string;
}> {
  if (!lead.cnsSubjectId) {
    return { found: false, error: "Missing cnsSubjectId" };
  }

  // Idempotent: do not re-ingest once we have a sync id / left awaiting_report.
  if (lead.cnsStatus !== "awaiting_report") {
    return { found: false, error: `Skip poll — status is ${lead.cnsStatus ?? "none"}` };
  }
  if (lead.cnsSyncId) {
    return { found: true };
  }

  const end = new Date();
  const begin = subYears(end, 1);
  const beginDate = format(begin, "yyyy-MM-dd");
  const endDate = format(end, "yyyy-MM-dd");

  const reports = await cnsListReports({
    subjectFilter: lead.cnsSubjectId,
    beginDate,
    endDate,
  });

  if (reports.length === 0) {
    await db.lead.update({
      where: { id: lead.id },
      data: {
        cnsLastPolledAt: new Date(),
        cnsPollAttempts: (lead.cnsPollAttempts ?? 0) + 1,
      },
    });
    return { found: false };
  }

  const match = reports[0]!;
  const pdf = await cnsDownloadReportPdf(match.syncId);
  const fileName = `cns-clinical-${match.syncId}.pdf`;
  const { storageKey, fileUrl } = await storeCaseDocument(
    lead.id,
    "cns_clinical_report",
    fileName,
    pdf,
  );

  const existing = await db.caseDocument.findMany({ where: { leadId: lead.id } });
  const prior = existing.find((d) => d.docKey === "cns_clinical_report");
  if (prior) {
    await db.caseDocument.update({
      where: { id: prior.id },
      data: {
        status: "UPLOADED",
        fileName,
        fileUrl,
        uploadedAt: new Date(),
      },
    });
  } else {
    await db.caseDocument.create({
      data: {
        leadId: lead.id,
        docKey: "cns_clinical_report",
        label: "CNS Clinical Report",
        required: false,
        status: "UPLOADED",
        fileName,
        fileUrl,
        uploadedAt: new Date(),
      },
    });
  }

  let summaryText: string;
  try {
    summaryText = await draftSummaryFromPdf(pdf);
  } catch (err) {
    summaryText = `[Summary generation failed — PDF stored]\n${err instanceof Error ? err.message : "unknown error"}`;
  }

  const stagePatch = nnOperationalPatchForStage("assessment_completed");

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      cnsSyncId: match.syncId,
      cnsPdfKey: storageKey,
      cnsStatus: "summary_draft",
      cnsSummaryText: summaryText,
      cnsSummaryStatus: "draft",
      cnsLastPolledAt: new Date(),
      cnsPollAttempts: (lead.cnsPollAttempts ?? 0) + 1,
      cnsLastError: null,
      funnelStage: "assessment_completed",
      probability: stagePatch.probability,
      pipelineValueEur: stagePatch.pipelineValueEur,
      expectedValue: stagePatch.expectedValue,
      operationalQueue: stagePatch.operationalQueue,
      caseStage: stagePatch.caseStage,
      nextAction: "Review CNS summary draft and approve for client",
    },
  });

  await note(
    lead.id,
    `[CNS] Report found sync ${match.syncId} · PDF stored · summary draft (${NN_CNS_SUMMARY_PROMPT_VERSION})`,
  );
  await logCaseTimeline(lead.id, "STAGE_CHANGED", "CNS report ready — summary draft", "System");
  await notifyCareSummaryDraft(updated, summaryText);

  return { found: true };
}

export async function approveAndSendCnsSummary(leadId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: "Lead not found" };
  if (!lead.cnsSummaryText) return { ok: false, error: "No summary draft" };
  if (lead.cnsSummaryStatus === "sent" || lead.cnsSummarySentAt) {
    return { ok: true };
  }
  if (lead.cnsSummaryStatus !== "draft" && lead.cnsStatus !== "summary_draft") {
    return { ok: false, error: "Summary is not awaiting approval" };
  }

  const body = `Hi ${lead.firstName},

Thank you for completing your Cognitive Health Assessment.

Below is a carefully worded summary of your CNS Vital Signs report. This is not a medical diagnosis — it is an educational overview of the scores in your report. Your care team remains available to discuss what this means for your brain health plan.

${lead.cnsSummaryText}

Your full clinical PDF is attached when available through our care team.

Next steps: explore programme tiers at ${siteUrl()}/shop or book a discovery call at ${siteUrl()}/discovery?leadId=${lead.id}.

In partnership,
Emer Sexton
NeuroNourish Clinic`;

  const result = await sendEmail({
    to: lead.email,
    subject: "Your Cognitive Assessment summary — NeuroNourish",
    body,
    category: "transactional",
    htmlOptions: {
      preheader: "Your assessment summary is ready",
      showDanielSignature: false,
      cta: {
        label: "Explore programme options",
        href: `${siteUrl()}/shop?leadId=${lead.id}`,
      },
    },
  });

  if (!result.sent && result.error) {
    return { ok: false, error: result.error };
  }

  await db.lead.update({
    where: { id: leadId },
    data: {
      cnsStatus: "summary_sent",
      cnsSummaryStatus: "sent",
      cnsSummaryApprovedAt: new Date(),
      cnsSummarySentAt: new Date(),
      nextAction: "Discuss programme options / discovery",
    },
  });
  await note(
    leadId,
    result.sent
      ? "[CNS] Summary approved and emailed to client"
      : "[CNS] Summary approved (email dry-run / logged)",
  );
  await logCaseTimeline(leadId, "EMAIL_SENT", "CNS summary emailed to client", "System");
  return { ok: true };
}

export async function markCnsPollExpired(lead: Lead) {
  await db.lead.update({
    where: { id: lead.id },
    data: {
      cnsStatus: "failed",
      cnsLastError: "Poll window expired without report",
      nextAction: "Chase CNS completion / re-issue test",
    },
  });
  await note(lead.id, "[CNS] Poll window expired — marked failed");
}
