import type { Lead } from "@/generated/prisma/client";
import { gsmSafeSms } from "@/lib/sms-encoding";
import { partnerDisplayName } from "@/lib/vertical-config";
import { treatmentLabel, timelineLabel } from "@/lib/healthcare-qualifications";

function bookUrl(leadId: string, siteUrl?: string) {
  const base = siteUrl?.replace(/\/$/, "") || "https://bookedconsult.com";
  return `${base}/lp/implants?leadId=${leadId}#book`;
}

function metaFromLead(lead: Lead) {
  try {
    const match = lead.additionalInfo?.match(/\{.*\}/);
    if (match) return JSON.parse(match[0]) as { treatmentType?: string; timeline?: string; postcode?: string };
  } catch {
    /* ignore */
  }
  return {
    treatmentType: lead.loanPurpose,
    timeline: lead.timeframe,
    postcode: lead.propertyLocation,
  };
}

export function healthcareQualifiedSmsBody(lead: Lead, siteUrl?: string) {
  const meta = metaFromLead(lead);
  const clinic = partnerDisplayName();
  const treatment = treatmentLabel(meta.treatmentType ?? lead.loanPurpose);
  return gsmSafeSms(
    `Hi ${lead.firstName}, ${clinic} received your ${treatment} enquiry. Book your free consultation: ${bookUrl(lead.id, siteUrl)}`,
  );
}

export function healthcarePartnerAlertSmsBody(lead: Lead) {
  const meta = metaFromLead(lead);
  const treatment = treatmentLabel(meta.treatmentType ?? lead.loanPurpose);
  const timeline = timelineLabel(meta.timeline ?? lead.timeframe);
  return gsmSafeSms(
    `New implant consult: ${lead.firstName} ${lead.lastName}, ${meta.postcode ?? lead.propertyLocation}, ${treatment}, ${timeline}. Check workspace.`,
  );
}

export function healthcareQualifiedEmail(lead: Lead, siteUrl?: string) {
  const meta = metaFromLead(lead);
  const clinic = partnerDisplayName();
  const treatment = treatmentLabel(meta.treatmentType ?? lead.loanPurpose);
  const url = bookUrl(lead.id, siteUrl);

  return {
    subject: `Your free implant consultation — ${clinic}`,
    body: `Hi ${lead.firstName},

Thank you for your enquiry about ${treatment}.

${clinic} has received your details and will confirm your free consultation shortly.

What happens next:
• Choose a consultation time using the link below
• You'll receive SMS confirmation
• The clinic may call to confirm details before your appointment

Your enquiry: ${treatment} · ${timelineLabel(meta.timeline ?? lead.timeframe)} · ${meta.postcode ?? lead.propertyLocation}

Booked Consult arranges bookings on behalf of participating dental clinics. Treatment is provided by the clinic's registered professionals.`,
    cta: { label: "Book your consultation", href: url },
  };
}

/** Banned in healthcare comms — used by healthcare:comms-audit */
export const HEALTHCARE_COMMS_BANNED = [
  /\bbridging\s+loan/i,
  /\bDaniel\b/i,
  /\bBLB\b/,
  /\bFCA\b/,
  /\b200\+\s+lenders/i,
  /\bborrower book\b/i,
] as const;
