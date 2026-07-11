import type { Lead } from "@/generated/prisma/client";
import { ActivityType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { estimateCommission } from "@/lib/speed-to-lead";

const DOCUMENT_CHECKLIST = [
  "Photo ID (passport or driving licence)",
  "Proof of address (utility bill or bank statement, last 3 months)",
  "Bank statements (last 3 months)",
  "Property details / particulars (if available)",
  "Existing mortgage statement (if applicable)",
] as const;

export async function requestDocuments(lead: Lead) {
  const checklist = DOCUMENT_CHECKLIST.map((item) => `□ ${item}`).join("\n");
  const uploadNote =
    process.env.NEXT_PUBLIC_DOCUMENT_UPLOAD_URL?.trim() ||
    "Reply to this email with your documents attached, or call 020 7177 4141.";

  const body = `Hi ${lead.firstName},

Thank you for speaking with Daniel. To progress your £${lead.loanAmount.toLocaleString("en-GB")} bridging finance enquiry, please upload:

${checklist}

${uploadNote}

Daniel Mehrnia
Bridging Loans Broker
020 7177 4141`;

  const email = await sendEmail({
    to: lead.email,
    subject: `Document request — Bridging Loans Broker`,
    body,
  });

  await db.lead.update({
    where: { id: lead.id },
    data: {
      operationalQueue: "AWAITING_DOCUMENTS",
      nextAction: "Chase documents",
      estimatedCommission: lead.estimatedCommission ?? estimateCommission(lead.loanAmount),
    },
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: ActivityType.DOCUMENT_REQUESTED,
      description: "Document request sent to borrower",
      metadata: JSON.stringify({ emailSent: email.sent }),
    },
  });

  await db.note.create({
    data: {
      leadId: lead.id,
      content: `Documents requested:\n${DOCUMENT_CHECKLIST.map((i) => `• ${i}`).join("\n")}`,
      author: "Daniel",
    },
  });

  return { emailSent: email.sent };
}
