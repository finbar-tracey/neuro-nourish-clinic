import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyWorkspaceAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyWorkspaceAuth(request)) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const { subject, message } = body as { subject?: string; message?: string };

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const emailSubject =
    subject?.trim() ||
    `Your bridging loan enquiry — ${lead.firstName}, next steps`;
  const emailBody =
    message?.trim() ||
    `Hi ${lead.firstName},

Thank you for your enquiry about bridging finance for £${lead.loanAmount.toLocaleString("en-GB")}.

I'd like to discuss your options and share indicative rates from our panel of 200+ specialist lenders.

When would be a good time for a quick call?

Best regards,
Daniel Mehrnia
Bridging Loans Broker
020 7177 4141
daniel@bridgingloansbroker.co.uk`;

  const result = await sendEmail({
    to: lead.email,
    subject: emailSubject,
    body: emailBody,
  });

  await db.activity.create({
    data: {
      leadId: id,
      type: "EMAIL_SENT",
      description: result.sent
        ? `Email sent: ${emailSubject}`
        : `Email logged (not sent): ${emailSubject}`,
      metadata: JSON.stringify({
        to: lead.email,
        subject: emailSubject,
        body: emailBody,
        resendId: result.id,
        sent: result.sent,
        error: result.error,
      }),
    },
  });

  if (lead.status === "NEW") {
    await db.lead.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    });
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    configured: emailConfigured(),
    error: result.error,
  });
}
