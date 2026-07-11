import type { Lead } from "@/generated/prisma/client";
import type { BrandedEmailOptions } from "@/lib/email-templates";
import { BRIDGING_DOCUMENT_TEMPLATE } from "@/lib/document-checklist";
import { borrowerBookUrl, borrowerLandingUrl, borrowerResumeUrl, borrowerUploadUrl } from "@/lib/sms-links";
import { getSiteUrl } from "@/lib/site-url";
import { LOAN_PURPOSES, TIMEFRAMES } from "@/lib/validations";

export type JourneyEmailId =
  | "capture-welcome"
  | "meta-capture-welcome"
  | "qualified-confirmation"
  | "priority-call-confirmed"
  | "booking-reminder"
  | "document-request"
  | "document-chase-24h"
  | "document-chase-48h"
  | "documents-received"
  | "application-submitted"
  | "offer-received"
  | "completion-scheduled"
  | "deal-completed"
  | "nurture-day-0"
  | "nurture-day-3"
  | "nurture-day-7"
  | "nurture-day-14"
  | "nurture-day-30"
  | "winback-lost-day-0"
  | "winback-lost-day-3"
  | "winback-lost-day-7"
  | "winback-lost-day-14"
  | "winback-lost-day-30"
  | "winback-long-day-0"
  | "winback-long-day-30"
  | "winback-long-day-90"
  | "qualified-chase-day-1"
  | "qualified-chase-day-3"
  | "qualified-chase-day-5"
  | "qualified-chase-day-7"
  | "broker-capture-alert"
  | "broker-priority-booked";

export type EmailContext = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanPurpose: string;
  timeframe: string;
  leadId?: string;
  /** Signed /lp/complete URL for Meta instant form leads */
  completeUrl?: string;
  displayTime?: string;
  slotLabel?: string;
  uploadLink?: string;
  teamsLink?: string | null;
  docChecklist?: string;
};

export type JourneyEmailContent = {
  id: JourneyEmailId;
  stage: string;
  audience: "borrower" | "broker";
  trigger: string;
  subject: string;
  body: string;
  options?: BrandedEmailOptions;
};

export const SAMPLE_EMAIL_CONTEXT: EmailContext = {
  firstName: "James",
  lastName: "Mitchell",
  email: "james.mitchell@example.com",
  phone: "07700 900123",
  loanAmount: 850_000,
  loanPurpose: "purchase_investment",
  timeframe: "within_4_weeks",
  leadId: "example-case-id",
  displayTime: "2:30pm today",
  slotLabel: "Today 2:30pm",
  uploadLink: "https://loans.bridgingloansbroker.co.uk/upload/a1b2c3d4e5f6",
  teamsLink: "https://teams.microsoft.com/l/meetup-join/example",
};

const DANIEL_PHONE = "020 7177 4141";

function caseUrl(leadId: string) {
  return `${getSiteUrl()}/workspace/cases/${leadId}`;
}

function uploadLinkFromToken(token: string) {
  return borrowerUploadUrl(token);
}

function fmt(amount: number) {
  return amount.toLocaleString("en-GB");
}

function label(
  opts: readonly { value: string; label: string }[],
  value: string,
): string {
  return opts.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
}

function defaultDocChecklist() {
  return BRIDGING_DOCUMENT_TEMPLATE.filter((d) => d.required)
    .map((d) => `□ ${d.label}`)
    .join("\n");
}

export function emailContextFromLead(
  lead: Lead,
  extra?: Partial<EmailContext>,
): EmailContext {
  const uploadLink =
    extra?.uploadLink ??
    (lead.uploadToken ? uploadLinkFromToken(lead.uploadToken) : undefined);

  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    loanAmount: lead.loanAmount,
    loanPurpose: lead.loanPurpose,
    timeframe: lead.timeframe,
    leadId: lead.id,
    displayTime: extra?.displayTime,
    slotLabel: extra?.slotLabel,
    uploadLink,
    teamsLink: extra?.teamsLink ?? lead.teamsMeetingUrl,
    docChecklist: extra?.docChecklist ?? defaultDocChecklist(),
  };
}

type EmailBuilder = (ctx: EmailContext) => Omit<JourneyEmailContent, "id">;

const BUILDERS: Record<JourneyEmailId, EmailBuilder> = {
  "capture-welcome": (ctx) => ({
    stage: "Step 2 — contact captured",
    audience: "borrower",
    trigger: "Form step 2 submitted (LEAD_CAPTURED automation)",
    subject: "Your bridging finance review — details saved",
    body: `Hi ${ctx.firstName},

Thanks for starting your bridging finance review with Bridging Loans Broker.

Daniel Mehrnia will personally review your £${fmt(ctx.loanAmount)} enquiry. Complete the final step to check eligibility — or we'll call you on ${ctx.phone} within 2 hours.`,
    options: {
      cta: {
        label: "Complete your eligibility check",
        href: ctx.leadId ? borrowerResumeUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "meta-capture-welcome": (ctx) => ({
    stage: "Meta instant form — partial",
    audience: "borrower",
    trigger: "Meta Lead Ads webhook ingest",
    subject: "Finish your property finance review (2 minutes)",
    body: `Hi ${ctx.firstName},

Thanks for your property finance enquiry with Bridging Loans Broker.

Please complete a short eligibility check so Daniel can review your £${fmt(ctx.loanAmount)} enquiry against 200+ specialist lenders.

This takes about 2 minutes — business and investment purposes only.`,
    options: {
      cta: {
        label: "Finish your review",
        href: ctx.completeUrl ?? (ctx.leadId ? borrowerResumeUrl(ctx.leadId) : borrowerLandingUrl()),
      },
    },
  }),

  "qualified-confirmation": (ctx) => ({
    stage: "Step 3 — qualified enquiry",
    audience: "borrower",
    trigger: "Full form submitted (qualified path)",
    subject: `Your bridging finance enquiry — £${fmt(ctx.loanAmount)}`,
    body: `Hi ${ctx.firstName},

Thank you for your bridging finance enquiry.

Daniel has received your request for £${fmt(ctx.loanAmount)} and will review your scenario personally.

What happens next:
• Daniel reviews your enquiry against 200+ specialist lenders
• You receive indicative rates and terms — no obligation
• We structure the right exit strategy for your deal
• Book a priority call at a time that suits you

Need to speak sooner? Call ${DANIEL_PHONE}.`,
    options: {
      cta: {
        label: "Book a priority call",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "priority-call-confirmed": (ctx) => {
    const teamsLine = ctx.teamsLink
      ? `\n\nJoin your consultation: ${ctx.teamsLink}`
      : "";
    return {
      stage: "Consultation booked",
      audience: "borrower",
      trigger: "Priority call booked on thank-you page",
      subject: `Priority call confirmed — ${ctx.displayTime ?? "your slot"}`,
      body: `Hi ${ctx.firstName},

Your priority call with Daniel Mehrnia is confirmed for ${ctx.displayTime ?? "your chosen time"}.

Daniel will call you to discuss your £${fmt(ctx.loanAmount)} bridging finance enquiry.${teamsLine}

Enquiry summary:
• Purpose: ${label(LOAN_PURPOSES, ctx.loanPurpose)}
• Amount: £${fmt(ctx.loanAmount)}
• Timeline: ${label(TIMEFRAMES, ctx.timeframe)}

If you need to speak sooner, call ${DANIEL_PHONE}.

Subject to status and lender criteria. Business and investment purposes only.`,
      options: ctx.teamsLink
        ? { cta: { label: "Join your consultation", href: ctx.teamsLink } }
        : undefined,
    };
  },

  "booking-reminder": (ctx) => {
    const teamsLine = ctx.teamsLink
      ? `\n\nJoin your consultation: ${ctx.teamsLink}`
      : "";
    return {
      stage: "Consultation booked",
      audience: "borrower",
      trigger: "Cron ~1 hour before priority call",
      subject: `Reminder: priority call today at ${ctx.displayTime ?? "your booked time"}`,
      body: `Hi ${ctx.firstName},

This is a reminder that your priority call with Daniel at Bridging Loans Broker is today at ${ctx.displayTime ?? "your booked time"}.${teamsLine}

Need to reschedule? Call ${DANIEL_PHONE}.`,
      options: ctx.teamsLink
        ? { cta: { label: "Join your consultation", href: ctx.teamsLink } }
        : ctx.leadId
          ? {
              cta: {
                label: "View your booking",
                href: borrowerBookUrl(ctx.leadId),
              },
            }
          : undefined,
    };
  },

  "document-request": (ctx) => ({
    stage: "Documents requested",
    audience: "borrower",
    trigger: "Broker requests documents in Case OS",
    subject: "Document request — Bridging Loans Broker",
    body: `Hi ${ctx.firstName},

To explore your bridging finance options, Daniel needs a few documents. Please upload them securely using the link below.

${ctx.docChecklist ?? defaultDocChecklist()}

Upload here: ${ctx.uploadLink ?? `${getSiteUrl()}/upload`}

This link expires in 30 days.

Subject to status and lender criteria. Business and investment purposes only.`,
    options: ctx.uploadLink
      ? { cta: { label: "Upload documents securely", href: ctx.uploadLink } }
      : undefined,
  }),

  "document-chase-24h": (ctx) => ({
    stage: "Documents requested",
    audience: "borrower",
    trigger: "Cron — documents outstanding 24+ hours",
    subject: "Reminder: documents needed — Bridging Loans Broker",
    body: `Hi ${ctx.firstName},

A quick reminder to upload your documents for your £${fmt(ctx.loanAmount)} bridging enquiry.

Daniel is ready to review your case as soon as everything is in.

Upload securely here: ${ctx.uploadLink ?? `${getSiteUrl()}/upload`}`,
    options: ctx.uploadLink
      ? { cta: { label: "Upload documents", href: ctx.uploadLink } }
      : undefined,
  }),

  "document-chase-48h": (ctx) => ({
    stage: "Documents requested",
    audience: "borrower",
    trigger: "Cron — documents outstanding 48+ hours",
    subject: "Documents still needed — Bridging Loans Broker",
    body: `Hi ${ctx.firstName},

Daniel is still waiting on a few documents for your bridging finance enquiry.

Upload securely here: ${ctx.uploadLink ?? `${getSiteUrl()}/upload`}`,
    options: ctx.uploadLink
      ? { cta: { label: "Complete your upload", href: ctx.uploadLink } }
      : undefined,
  }),

  "documents-received": (ctx) => ({
    stage: "Documents received",
    audience: "borrower",
    trigger: "All required documents uploaded or broker marks received",
    subject: "Documents received — we're preparing your application",
    body: `Hi ${ctx.firstName},

Thank you — we've received your documents for your £${fmt(ctx.loanAmount)} bridging enquiry.

Daniel is now reviewing everything and preparing your application for submission to our lender panel. We'll be in touch within 2 working days with next steps or if anything else is needed.`,
  }),

  "application-submitted": (ctx) => ({
    stage: "Application submitted",
    audience: "borrower",
    trigger: "Case advanced to APPLICATION_SUBMITTED",
    subject: "Your bridging application has been submitted",
    body: `Hi ${ctx.firstName},

Good news — your bridging finance application for £${fmt(ctx.loanAmount)} has been submitted to our specialist lenders.

What to expect:
• Initial feedback typically within 24–48 hours
• Daniel will contact you as soon as we have indicative terms
• We may request one or two clarifications — we'll make this as smooth as possible

Questions in the meantime? Call ${DANIEL_PHONE}.`,
  }),

  "offer-received": (ctx) => ({
    stage: "Offer received",
    audience: "borrower",
    trigger: "Case advanced to OFFER_RECEIVED",
    subject: "Indicative terms received for your bridging loan",
    body: `Hi ${ctx.firstName},

We've received indicative terms from a specialist lender for your £${fmt(ctx.loanAmount)} bridging enquiry.

Daniel will walk you through the offer, fees, and exit strategy on a call — nothing is committed until you're happy to proceed.

Call ${DANIEL_PHONE} to discuss, or reply to this email with a good time to talk.`,
  }),

  "completion-scheduled": (ctx) => ({
    stage: "Completion scheduled",
    audience: "borrower",
    trigger: "Case advanced to COMPLETION_SCHEDULED",
    subject: "Completion date confirmed — Bridging Loans Broker",
    body: `Hi ${ctx.firstName},

Your bridging finance completion is now scheduled.

Daniel will send a short checklist before completion day covering solicitor details, final figures, and anything still outstanding.

If your solicitor or completion date changes, let us know as soon as possible on ${DANIEL_PHONE}.`,
  }),

  "deal-completed": (ctx) => ({
    stage: "Completed",
    audience: "borrower",
    trigger: "Case advanced to COMPLETED",
    subject: "Congratulations — your bridging loan has completed",
    body: `Hi ${ctx.firstName},

Congratulations — your £${fmt(ctx.loanAmount)} bridging loan has completed.

Thank you for trusting Bridging Loans Broker. If you need funding for a future project, Daniel is always available on ${DANIEL_PHONE}.

We'd really appreciate a Google review if you had a good experience — it helps other investors find independent broker support.`,
    options: {
      cta: {
        label: "Leave a Google review",
        href: "https://www.google.com/search?q=Bridging+Loans+Broker+reviews",
      },
    },
  }),

  "nurture-day-0": (ctx) => ({
    stage: "Follow-up nurture",
    audience: "borrower",
    trigger: "Long timeframe — nurture day 0",
    subject: "Planning ahead for bridging finance — a quick guide",
    body: `Hi ${ctx.firstName},

Thanks for your interest in bridging finance. You mentioned you're looking at a timeline beyond 3 months — that's smart planning.

Bridging loans work best for urgent property deals: auction purchases, business and investment property, and refurbishments with a clear exit within 12–36 months.

Over the next few weeks, we'll send you practical guides to help you prepare — so when you're ready to move, funding can be arranged fast.`,
  }),

  "nurture-day-3": (ctx) => ({
    stage: "Follow-up nurture",
    audience: "borrower",
    trigger: "Nurture sequence — day 3",
    subject: "How to prepare your deal for a fast bridging approval",
    body: `Hi ${ctx.firstName},

When you're ready to proceed, having these ready speeds up approval from weeks to days:

• Clear exit strategy (sale, refinance, or completion of works)
• Property valuation or purchase price agreed
• Company structure confirmed (personal name, Ltd, or SPV)
• Summary of the deal and loan amount required

Reply to this email anytime if you'd like to discuss your scenario.`,
  }),

  "nurture-day-7": (ctx) => ({
    stage: "Follow-up nurture",
    audience: "borrower",
    trigger: "Nurture sequence — day 7",
    subject: "Bridging loan rates, LTV & costs explained",
    body: `Hi ${ctx.firstName},

Key numbers investors ask about:

• Rates from 0.45% per month (deal-dependent)
• Residential LTV up to 75% · Commercial up to 70%
• Terms typically 3–36 months
• Completion in 3–10 days (48 hours for urgent cases)

When your timeline moves closer, request a free indicative quote — no obligation, no hard credit check.`,
  }),

  "nurture-day-14": (ctx) => ({
    stage: "Follow-up nurture",
    audience: "borrower",
    trigger: "Nurture sequence — day 14",
    subject: "How investors use bridging — 3 common scenarios",
    body: `Hi ${ctx.firstName},

The three deals we arrange most often:

1. Auction purchases — pre-approved funding before you bid
2. Chain breaks — buy your next property before your sale completes
3. Refurbishment — fund works before a standard mortgage is possible

Which sounds closest to your plans? Hit reply and I'll point you in the right direction.`,
  }),

  "nurture-day-30": (ctx) => ({
    stage: "Follow-up nurture",
    audience: "borrower",
    trigger: "Nurture sequence — day 30",
    subject: "Ready to explore your bridging options?",
    body: `Hi ${ctx.firstName},

It's been about a month since you enquired about bridging finance for £${fmt(ctx.loanAmount)}.

If your timeline has moved up, we'd love to help. Request a free quote at bridgingloansbroker.co.uk — Daniel will respond within 2 hours.

Or call us directly: ${DANIEL_PHONE}`,
    options: {
      cta: { label: "Get a free quote", href: borrowerLandingUrl() },
    },
  }),

  "winback-lost-day-0": (ctx) => ({
    stage: "Win-back",
    audience: "borrower",
    trigger: "Lost case enrolled on win-back — day 0",
    subject: "Still exploring bridging finance?",
    body: `Hi ${ctx.firstName},

We spoke recently about bridging finance for £${fmt(ctx.loanAmount)} — I wanted to check whether your plans have moved forward.

If timing has changed or you'd like a fresh indicative quote, reply to this email or request one online. No obligation and no hard credit check.

Daniel Mehrnia
Bridging Loans Broker`,
    options: {
      cta: { label: "Get a free quote", href: borrowerLandingUrl() },
    },
  }),

  "winback-lost-day-3": (ctx) => ({
    stage: "Win-back",
    audience: "borrower",
    trigger: "Win-back sequence — day 3",
    subject: "Quick check-in on your bridging enquiry",
    body: `Hi ${ctx.firstName},

Just a brief follow-up on your £${fmt(ctx.loanAmount)} bridging enquiry for ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()}.

If you're still weighing options, I'm happy to talk through rates, timelines, and what documents help us move fastest when you're ready.

Reply anytime — or book a short call at a time that suits you.`,
    options: {
      cta: {
        label: "Book a call",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "winback-lost-day-7": (ctx) => ({
    stage: "Win-back",
    audience: "borrower",
    trigger: "Win-back sequence — day 7",
    subject: "Bridging speeds & costs — a quick refresher",
    body: `Hi ${ctx.firstName},

A few numbers investors find useful when plans firm up:

• Rates from 0.45% per month (deal-dependent)
• Residential LTV up to 75% · Commercial up to 70%
• Completion in 3–10 days (48 hours for urgent cases)

For your ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()} scenario at £${fmt(ctx.loanAmount)}, we can usually issue an indicative quote within 2 hours once you're ready.`,
    options: {
      cta: { label: "Request a quote", href: borrowerLandingUrl() },
    },
  }),

  "winback-lost-day-14": (ctx) => ({
    stage: "Win-back",
    audience: "borrower",
    trigger: "Win-back sequence — day 14",
    subject: "Has your timeline changed?",
    body: `Hi ${ctx.firstName},

If your property plans have moved up — auction date, business deal, or refurb timeline — let me know.

We arrange bridging for deals across the UK and can often confirm eligibility quickly once basic details are in place.

Has anything changed since we last spoke?`,
    options: {
      cta: { label: "Resume your enquiry", href: borrowerResumeUrl(ctx.leadId ?? "") },
    },
  }),

  "winback-lost-day-30": (ctx) => ({
    stage: "Win-back",
    audience: "borrower",
    trigger: "Win-back sequence — day 30",
    subject: "Here when you need bridging finance",
    body: `Hi ${ctx.firstName},

This will be my last check-in for now on your ${fmt(ctx.loanAmount)} bridging enquiry for ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()}.

If funding becomes relevant again, we'd be glad to help. Request a quote anytime or call ${DANIEL_PHONE}.

Daniel Mehrnia
Bridging Loans Broker`,
    options: {
      cta: { label: "Get a free quote", href: borrowerLandingUrl() },
    },
  }),

  "winback-long-day-0": (ctx) => ({
    stage: "Win-back (long)",
    audience: "borrower",
    trigger: "Funding delayed — win-back day 0",
    subject: "When your bridging timeline moves up",
    body: `Hi ${ctx.firstName},

You mentioned funding may not be needed right now — that's fine.

When your ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()} plans for £${fmt(ctx.loanAmount)} become active again, reply to this email or request an indicative quote. No obligation.

Daniel Mehrnia
Bridging Loans Broker`,
    options: {
      cta: { label: "Get a free quote", href: borrowerLandingUrl() },
    },
  }),

  "winback-long-day-30": (ctx) => ({
    stage: "Win-back (long)",
    audience: "borrower",
    trigger: "Funding delayed — win-back day 30",
    subject: "Checking in on your property plans",
    body: `Hi ${ctx.firstName},

A quick note in case your bridging timeline for ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()} has moved closer.

We arrange funding in 3–10 days for deals across the UK. Happy to run numbers when you're ready.

Daniel`,
    options: {
      cta: { label: "Book a call", href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl() },
    },
  }),

  "winback-long-day-90": (ctx) => ({
    stage: "Win-back (long)",
    audience: "borrower",
    trigger: "Funding delayed — win-back day 90",
    subject: "Bridging finance — here when you need us",
    body: `Hi ${ctx.firstName},

This is my final check-in on your £${fmt(ctx.loanAmount)} bridging enquiry.

If plans change, we're here to help with ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()} and similar deals.

Daniel Mehrnia
Bridging Loans Broker`,
    options: {
      cta: { label: "Get a free quote", href: borrowerLandingUrl() },
    },
  }),

  "qualified-chase-day-1": (ctx) => ({
    stage: "Booking chase",
    audience: "borrower",
    trigger: "Qualified lead unreachable — day 1",
    subject: `Book your priority call — £${fmt(ctx.loanAmount)} enquiry`,
    body: `Hi ${ctx.firstName},

Daniel Mehrnia tried to reach you about your £${fmt(ctx.loanAmount)} bridging finance enquiry.

Book a priority call at a time that suits you — it only takes a moment.`,
    options: {
      cta: {
        label: "Book a priority call",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "qualified-chase-day-3": (ctx) => ({
    stage: "Booking chase",
    audience: "borrower",
    trigger: "Qualified lead unreachable — day 3",
    subject: "Your bridging finance enquiry is ready to review",
    body: `Hi ${ctx.firstName},

Daniel has reviewed your ${label(LOAN_PURPOSES, ctx.loanPurpose).toLowerCase()} enquiry for £${fmt(ctx.loanAmount)} against 200+ specialist lenders.

On a short call he can outline indicative rates, terms, and exit strategy — no obligation.`,
    options: {
      cta: {
        label: "Book your call",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "qualified-chase-day-5": (ctx) => ({
    stage: "Booking chase",
    audience: "borrower",
    trigger: "Qualified lead unreachable — day 5",
    subject: "Still here to help with your bridging enquiry",
    body: `Hi ${ctx.firstName},

We haven't managed to connect yet on your £${fmt(ctx.loanAmount)} bridging enquiry.

If timing wasn't right before, you can book a call whenever suits — Daniel will walk through options personally.`,
    options: {
      cta: {
        label: "Choose a call time",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "qualified-chase-day-7": (ctx) => ({
    stage: "Booking chase",
    audience: "borrower",
    trigger: "Qualified lead unreachable — day 7",
    subject: "Last chance to book your priority call",
    body: `Hi ${ctx.firstName},

This is our final reminder about your £${fmt(ctx.loanAmount)} bridging finance enquiry.

Book a priority call with Daniel, or call ${DANIEL_PHONE} if you'd prefer to speak now.`,
    options: {
      cta: {
        label: "Book a priority call",
        href: ctx.leadId ? borrowerBookUrl(ctx.leadId) : borrowerLandingUrl(),
      },
    },
  }),

  "broker-capture-alert": (ctx) => ({
    stage: "Step 2 — contact captured",
    audience: "broker",
    trigger: "LEAD_CAPTURED automation → Daniel",
    subject: "New lead — step 2 captured (call within 2hrs)",
    body: `Partial enquiry — step 3 may be abandoned.

${ctx.firstName} ${ctx.lastName}
${ctx.phone} | ${ctx.email}

£${fmt(ctx.loanAmount)} | ${ctx.loanPurpose} | ${ctx.timeframe}

Call within 2 hours even if step 3 is not completed.`,
  }),

  "broker-priority-booked": (ctx) => ({
    stage: "Consultation booked",
    audience: "broker",
    trigger: "Priority call booked",
    subject: `Priority call booked — ${ctx.firstName} ${ctx.lastName} (${ctx.displayTime ?? "slot"})`,
    body: `Priority call booked from thank-you page.

Time: ${ctx.slotLabel ?? ctx.displayTime ?? "—"}

${ctx.firstName} ${ctx.lastName}
${ctx.email}
${ctx.phone}

Loan: £${fmt(ctx.loanAmount)}
Purpose: ${ctx.loanPurpose}
Timeframe: ${ctx.timeframe}

${ctx.teamsLink ? `Teams link: ${ctx.teamsLink}` : "No Teams link — call the lead at the booked time."}

Open case: ${ctx.leadId ? caseUrl(ctx.leadId) : `${getSiteUrl()}/workspace`}`,
    options: ctx.teamsLink
      ? {
          cta: { label: "Join Teams meeting", href: ctx.teamsLink },
          showPhoneCta: false,
        }
      : ctx.leadId
        ? {
            cta: {
              label: "Open case in workspace",
              href: caseUrl(ctx.leadId),
            },
            showPhoneCta: false,
          }
        : undefined,
  }),
};

export const NURTURE_EMAIL_SCHEDULE: Array<{ day: number; id: JourneyEmailId }> = [
  { day: 0, id: "nurture-day-0" },
  { day: 3, id: "nurture-day-3" },
  { day: 7, id: "nurture-day-7" },
  { day: 14, id: "nurture-day-14" },
  { day: 30, id: "nurture-day-30" },
];

export const JOURNEY_EMAIL_IDS = Object.keys(BUILDERS) as JourneyEmailId[];

export function buildJourneyEmail(
  id: JourneyEmailId,
  ctx: EmailContext = SAMPLE_EMAIL_CONTEXT,
): JourneyEmailContent {
  const built = BUILDERS[id](ctx);
  return { id, ...built };
}

/** Catalog for previews and audits — all templates are live implementations. */
export function journeyEmailCatalog(ctx: EmailContext = SAMPLE_EMAIL_CONTEXT) {
  return JOURNEY_EMAIL_IDS.map((id) => ({
    ...buildJourneyEmail(id, ctx),
    status: "live" as const,
  }));
}

/** Automation DB templates — keep {{placeholders}} in sync with journey copy. */
export function automationTemplate(id: "capture-welcome" | "broker-capture-alert") {
  const templates = {
    "capture-welcome": {
      emailSubject: "Your bridging finance review — details saved",
      emailBody: `Hi {{firstName}},

Thanks for starting your bridging finance review with Bridging Loans Broker.

Daniel Mehrnia will personally review your £{{loanAmount}} enquiry. Complete the final step to check eligibility — or we'll call you on {{phone}} within 2 hours.`,
    },
    "broker-capture-alert": {
      emailSubject: "New lead — step 2 captured (call within 2hrs)",
      emailBody: `Partial enquiry — step 3 may be abandoned.

{{firstName}} {{lastName}}
{{phone}} | {{email}}

£{{loanAmount}} | {{loanPurpose}} | {{timeframe}}

Call within 2 hours even if step 3 is not completed.`,
    },
  };
  return templates[id];
}

export function journeyEmailSentTag(id: JourneyEmailId) {
  return `[Journey email: ${id}]`;
}

export function hasJourneyEmailBeenSent(lead: Lead, id: JourneyEmailId) {
  return lead.additionalInfo?.includes(journeyEmailSentTag(id)) ?? false;
}

export function appendJourneyEmailTag(existing: string | null | undefined, id: JourneyEmailId) {
  const tag = journeyEmailSentTag(id);
  if (existing?.includes(tag)) return existing ?? tag;
  return existing ? `${tag} ${existing}` : tag;
}
