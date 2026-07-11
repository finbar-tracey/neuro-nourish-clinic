import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { cancelSequenceTasksByPrefix } from "@/lib/cancel-sequence-tasks";
import {
  NN_B2B_EMPLOYER_AUTO_RESPONSE,
  NN_B2B_BRIEFING_FOLLOWUP,
  NN_B2B_MISSED_BRIEFING_NURTURE,
  NN_ENTERPRISE_BRIEFING_NURTURE,
  NN_MISSED_CALL_NURTURE,
  NN_NEWSLETTER_BLOOD_SUGAR_SERIES,
  NN_NEWSLETTER_GUT_BRAIN_SERIES,
  NN_ONBOARDING_WELCOME,
} from "@/lib/neuronourish-copy";
import { NN_PRICING } from "@/lib/neuronourish-funnel";
import { siteUrl } from "@/lib/site-url";
import { runtimeEnv } from "@/lib/runtime-env";

type NurtureKey =
  | "quiz_abandon"
  | "quiz_complete"
  | "assessment_abandon"
  | "assessment_complete"
  | "programme_nurture"
  | "clinician_b2b"
  | "clinician_briefing_followup"
  | "employer_briefing_followup"
  | "missed_discovery_call"
  | "missed_b2b_briefing_call"
  | "discovery_post_call"
  | "blood_sugar_newsletter"
  | "gut_brain_newsletter"
  | "onboarding_welcome"
  | "eoi";

/** Delays in hours from enrollment. First quiz-complete email fires at 2 minutes. */
const DELAYS_HOURS: Record<NurtureKey, number[]> = {
  quiz_abandon: [1, 24, 72],
  quiz_complete: [2 / 60, 48, 96, 144],
  assessment_abandon: [4, 24, 72],
  assessment_complete: [24, 72, 168],
  programme_nurture: [48, 120],
  clinician_b2b: [5 / 60, 48, 96, 168],
  clinician_briefing_followup: [72, 144, 240], // Day 3 · Day 6 · Day 10 cold briefing follow-up
  employer_briefing_followup: [48, 120, 216], // Day 2 · Day 5 · Day 9 enterprise cold briefing
  missed_discovery_call: [2, 48, 120],
  missed_b2b_briefing_call: [2, 48, 120],
  discovery_post_call: [2, 48, 120],
  blood_sugar_newsletter: [24, 72, 120],
  gut_brain_newsletter: [48, 96, 144],
  onboarding_welcome: [5 / 60, 48, 120],
  eoi: [4, 48],
};

function clinicianSalutation(lead: Lead) {
  const fallback = firstName(lead);
  const last = lead.lastName?.trim();
  if (!last) return fallback;
  return `Dr. ${last}`;
}

function firstName(lead: Lead) {
  return lead.firstName?.trim() || "there";
}

function discoveryCta(label: string, url: string) {
  return `${label}\n${url}`;
}

function missedCallBody(template: string, lead: Lead, ctaLabel: string, ctaUrl: string) {
  const name = firstName(lead);
  return template
    .replace(/\[First Name\]/g, name)
    .replace(/\[[^\]]+\]/, `${ctaLabel}\n${ctaUrl}`);
}

function newsletterBloodSugarBody(
  template: string,
  lead: Lead,
  options?: { withDiscoveryCta?: boolean },
) {
  const name = firstName(lead);
  let body = template.replace(/\[First Name\]/g, name);
  if (options?.withDiscoveryCta) {
    const discovery = `${siteUrl()}${NN_NEWSLETTER_BLOOD_SUGAR_SERIES.part3.ctaDestination}?leadId=${lead.id}`;
    body = body.replace(
      /\[[^\]]+\]/,
      `${NN_NEWSLETTER_BLOOD_SUGAR_SERIES.part3.ctaLabel}\n${discovery}`,
    );
  }
  return body;
}

function formatCreditExpiry(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function programmeCreditExpiryEmails(
  lead: Lead,
): { subject: string; body: string; dueDate: Date }[] {
  if (!lead.creditExpiryDate) return [];

  const name = firstName(lead);
  const programmeUrl = `${siteUrl()}/programme?leadId=${lead.id}`;
  const expiryFormatted = formatCreditExpiry(lead.creditExpiryDate);
  const now = Date.now();
  const expiryMs = new Date(lead.creditExpiryDate).getTime();
  const msDay = 24 * 60 * 60 * 1000;

  const steps = [
    {
      dueDate: new Date(now + 7 * msDay),
      subject: "Structuring your 12-month cognitive resilience architecture",
      body: `Dear ${name},

Now that your baseline cognitive evaluations are locked into your secure profile, our clinical team is finalizing your physiological data framework. True neuroprotection is built through continuous adaptation over a full annual cycle, not short-term adjustments.

As a reminder, your initial ${NN_PRICING.assessmentLabel} assessment fee is fully credited toward your 12-Month Programme enrollment until ${expiryFormatted}.

${discoveryCta("Upgrade to Full 12-Month Protocol", programmeUrl)}

In partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
    },
    {
      dueDate: new Date(expiryMs - 7 * msDay),
      subject: `Urgency notice: 7 days remaining on your ${NN_PRICING.assessmentLabel} cognitive care credit`,
      body: `Dear ${name},

We are reaching out to inform you that you have exactly 7 days remaining within your verified eligibility window. Your initial assessment fee expires on ${expiryFormatted}. Upgrading today carries your ${NN_PRICING.assessmentLabel} balance directly into your comprehensive, supervised care protocols.

${discoveryCta("Apply My €90 Credit & Upgrade", programmeUrl)}

Best regards,
The NeuroNourish Clinical Team`,
    },
    {
      dueDate: new Date(expiryMs - 2 * msDay),
      subject: "Final notice: Your NeuroNourish programme credit expires in 48 hours",
      body: `Dear ${name},

This is your final notice. In exactly 48 hours, your clinical intake credit allocation will expire, and your unallocated testing profile token will be released back to our incoming waitlist cohort. Protect your cognitive future and lock in your assigned personal health coach and dietetic tracking resources before ${expiryFormatted}.

${discoveryCta("Secure My Cohort Allocation Now", programmeUrl)}

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
    },
  ];

  return steps.filter((step) => step.dueDate.getTime() > now + 60_000);
}

function bloodSugarNewsletterEmails(lead: Lead): { subject: string; body: string }[] {
  const series = NN_NEWSLETTER_BLOOD_SUGAR_SERIES;
  return [
    { subject: series.part1.subject, body: newsletterBloodSugarBody(series.part1.body, lead) },
    { subject: series.part2.subject, body: newsletterBloodSugarBody(series.part2.body, lead) },
    {
      subject: series.part3.subject,
      body: newsletterBloodSugarBody(series.part3.body, lead, { withDiscoveryCta: true }),
    },
  ];
}

function newsletterGutBrainBody(
  template: string,
  lead: Lead,
  options?: { withDiscoveryCta?: boolean },
) {
  const name = firstName(lead);
  let body = template.replace(/\[First Name\]/g, name);
  if (options?.withDiscoveryCta) {
    const discovery = `${siteUrl()}${NN_NEWSLETTER_GUT_BRAIN_SERIES.part3.ctaDestination}?leadId=${lead.id}`;
    body = body.replace(
      /\[[^\]]+\]/,
      `${NN_NEWSLETTER_GUT_BRAIN_SERIES.part3.ctaLabel}\n${discovery}`,
    );
  }
  return body;
}

function gutBrainNewsletterEmails(lead: Lead): { subject: string; body: string }[] {
  const series = NN_NEWSLETTER_GUT_BRAIN_SERIES;
  return [
    { subject: series.part1.subject, body: newsletterGutBrainBody(series.part1.body, lead) },
    { subject: series.part2.subject, body: newsletterGutBrainBody(series.part2.body, lead) },
    {
      subject: series.part3.subject,
      body: newsletterGutBrainBody(series.part3.body, lead, { withDiscoveryCta: true }),
    },
  ];
}

function onboardingWelcomeBody(template: string, lead: Lead, ctaLabel: string, ctaUrl: string) {
  const name = firstName(lead);
  return template
    .replace(/\[First Name\]/g, name)
    .replace(/\[[^\]]+\]/, discoveryCta(ctaLabel, ctaUrl));
}

function onboardingWelcomeEmails(lead: Lead): { subject: string; body: string }[] {
  const copy = NN_ONBOARDING_WELCOME;
  const dashboard = `${siteUrl()}/dashboard?leadId=${lead.id}`;
  const discovery = `${siteUrl()}/discovery?leadId=${lead.id}`;
  return [
    {
      subject: copy.step1.subject,
      body: onboardingWelcomeBody(copy.step1.body, lead, copy.step1.ctaLabel, dashboard),
    },
    {
      subject: copy.step2.subject,
      body: onboardingWelcomeBody(copy.step2.body, lead, copy.step2.ctaLabel, dashboard),
    },
    {
      subject: copy.step3.subject,
      body: onboardingWelcomeBody(copy.step3.body, lead, copy.step3.ctaLabel, discovery),
    },
  ];
}

function enterpriseBriefingBody(template: string, lead: Lead, ctaLabel: string, ctaUrl: string) {
  const name = firstName(lead);
  return template
    .replace(/\[Contact Name\]/g, name)
    .replace(/\[[^\]]+\]/, `${ctaLabel}\n${ctaUrl}`);
}

function clinicianPartnerBody(template: string, lead: Lead, ctaLabel: string, ctaUrl: string) {
  const salutation = clinicianSalutation(lead);
  return template
    .replace(/\[Dr\. Last Name \/ Clinical Partner\]/g, salutation)
    .replace(/\[Clinical Partner\]/g, salutation)
    .replace(/\[Contact Name\]/g, firstName(lead))
    .replace(/\[[^\]]+\]/, `${ctaLabel}\n${ctaUrl}`);
}

function clinicianBriefingFollowupEmails(lead: Lead): { subject: string; body: string }[] {
  const discovery = `${siteUrl()}/discovery?leadId=${lead.id}`;
  const steps = [
    {
      ...NN_B2B_BRIEFING_FOLLOWUP.step1,
      cta: "Schedule Your 10-Minute Clinical Briefing Call",
    },
    {
      ...NN_B2B_BRIEFING_FOLLOWUP.step2,
      cta: "Request a 5-Minute Platform Walkthrough",
    },
    {
      ...NN_B2B_BRIEFING_FOLLOWUP.step3,
      cta: "Secure an August Practice Integration Call",
    },
  ];
  return steps.map((step) => ({
    subject: step.subject,
    body: clinicianPartnerBody(step.body, lead, step.cta, discovery),
  }));
}

function missedB2BBriefingEmails(lead: Lead): { subject: string; body: string }[] {
  const discovery = `${siteUrl()}/discovery`;
  const steps = [
    {
      ...NN_B2B_MISSED_BRIEFING_NURTURE.step1,
      cta: "Re-schedule Your Practice Briefing Call",
    },
    {
      ...NN_B2B_MISSED_BRIEFING_NURTURE.step2,
      cta: "Select a Convenient Integration Briefing Time",
    },
    {
      ...NN_B2B_MISSED_BRIEFING_NURTURE.step3,
      cta: "Secure an August Practice Integration Call",
    },
  ];
  return steps.map((step) => ({
    subject: step.subject,
    body: clinicianPartnerBody(step.body, lead, step.cta, discovery),
  }));
}

function employerBriefingEmails(lead: Lead): { subject: string; body: string }[] {
  const discovery = `${siteUrl()}/discovery?leadId=${lead.id}`;
  const steps = [
    {
      ...NN_ENTERPRISE_BRIEFING_NURTURE.step1,
      cta: "Secure an Enterprise Briefing Call Here",
    },
    {
      ...NN_ENTERPRISE_BRIEFING_NURTURE.step2,
      cta: "Request an Interface Demonstration",
    },
    {
      ...NN_ENTERPRISE_BRIEFING_NURTURE.step3,
      cta: "Secure an August Corporate Integration Call",
    },
  ];
  return steps.map((step) => ({
    subject: step.subject,
    body: enterpriseBriefingBody(step.body, lead, step.cta, discovery),
  }));
}

function missedCallEmails(lead: Lead): { subject: string; body: string }[] {
  const discovery = `${siteUrl()}/discovery?leadId=${lead.id}&recovered=true`;
  const steps = [
    {
      ...NN_MISSED_CALL_NURTURE.step1,
      cta: "Re-schedule My Discovery Consultation",
    },
    {
      ...NN_MISSED_CALL_NURTURE.step2,
      cta: "Re-book My 15-Minute Review Session Here",
    },
    {
      ...NN_MISSED_CALL_NURTURE.step3,
      cta: "Secure My August Onboarding Conversation",
    },
  ];
  return steps.map((step) => ({
    subject: step.subject,
    body: missedCallBody(step.body, lead, step.cta, discovery),
  }));
}

function emailBodies(key: NurtureKey, lead: Lead): { subject: string; body: string }[] {
  const name = firstName(lead);
  const quiz = `${siteUrl()}/quiz`;
  const assessment = `${siteUrl()}/assessment?leadId=${lead.id}`;
  const programme = `${siteUrl()}/programme?leadId=${lead.id}`;
  const discovery = `${siteUrl()}/discovery`;
  const results = `${siteUrl()}/quiz/results?leadId=${lead.id}`;
  const clinics = `${siteUrl()}/clinics`;
  const clinicsBriefing = `${siteUrl()}/clinics#partnership-briefing`;
  const clinicianName = clinicianSalutation(lead);

  switch (key) {
    case "quiz_abandon":
      return [
        {
          subject: "Your brain health results are waiting",
          body: `Dear ${name},

You made it through the questions — we just need a moment to send your score and personalised insights.

Your answers are safely saved. Finish in under a minute to unlock your brain health score and email your full report.

${discoveryCta("See my brain health score", quiz)}

In partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
        {
          subject: "Why knowing your cognitive starting point brings peace of mind",
          body: `Dear ${name},

Sometimes we pause before seeing our results because we are quietly anxious about what the metrics might reveal. If you completed the quiz questions but have not yet viewed your score, we want to reassure you: you are not helpless.

The science of neuroplasticity proves that your brain is fully capable of growing, adapting, and building resilient cognitive reserve — provided it has the right strategy.

A baseline score is not a final judgment or a clinical diagnosis. It is a helpful, objective tool that shows which modifiable lifestyle and nutritional areas can be optimized to protect your mental focus.

Take ownership of your cognitive future. Open your results and let's replace worry with meaningful data.

${discoveryCta("View my results", quiz)}

In partnership,
The NeuroNourish Care Team`,
        },
        {
          subject: "The financial plan vs. the brain plan",
          body: `Dear ${name},

We spend decades of our lives meticulously planning, investing, and calculating financially for our retirement. Yet, very few people are ever handed a structured, evidence-based plan to protect the actual health of the brain they will rely on to enjoy that future.

At NeuroNourish, we translate complex neuroscience into simple, prioritized everyday actions tailored to your individual biology. We combine advanced biomarker reviews with continuous personal coaching over 12 months to ensure your changes turn into permanent habits.

You don't need to wait for a cognitive crisis to start prioritizing your mind. Finish viewing your quiz results today, or if you prefer a conversation first, book a complimentary 15-minute discovery call with our team.

${discoveryCta("Continue to my results", quiz)}

In partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
      ];
    case "quiz_complete":
      return [
        {
          subject: "Your Brain Health Baseline + Next Steps",
          body: `Dear ${name},

Thank you for taking the time to complete the NeuroNourish Brain Health Assessment Quiz. By measuring your day-to-day routines against known protective factors for the nervous system, you have taken a proactive step toward prioritizing your long-term cognitive wellness.

Your initial inputs suggest that while your foundation contains excellent protective habits, your biological markers show distinct sub-categories that can be actively optimized.

Your brain remains capable of learning, adapting, and building resilient cognitive reserve at any stage of life—provided it has a precise, data-driven strategy. To move from high-level lifestyle insights to concrete, clinical action, we recommend booking an initial conversation with our care team.

${discoveryCta("Book Your Complimentary Discovery Call", discovery)}

View your quiz results: ${results}

In collaborative partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
        {
          subject: "Why short-term quick-fixes fail the nervous system",
          body: `Dear ${name},

We spend decades meticulously planning and investing financially for our retirement, yet very few people are ever given a clear, structured framework to protect the actual health of their brain.

When subtle cognitive shifts begin to surface—such as persistent afternoon brain fog, slower mental processing speed, or moments of forgotten words—the standard approach is reactive. People frequently look for isolated wellness advice, unvalidated vitamin regimes, or short-term quick fixes.

Nervous system optimization does not function that way. Shifting deeply rooted metabolic baselines and building lasting neuroplasticity requires time, professional tracking, and structured execution. That is exactly why our personalized brain health protocol is engineered as a comprehensive 12-month program. True protection happens when we replace guesswork with objective data.

If you are ready to stop guessing about your cognitive future, let's begin with a simple conversation.

${discoveryCta("Book Your Discovery Call Here", discovery)}

In partnership,
The NeuroNourish Clinical Team`,
        },
        {
          subject: "Turning clinical biomarker data into brain clarity",
          body: `Dear ${name},

Science alone does not change lives. Real personal optimization occurs when you understand exactly how your unique biology dictates your focus, mental clarity, and memory every single day.

At NeuroNourish, our personalized brain health program looks entirely at the underlying root causes of cognitive shifts. We do not focus on symptoms alone. By analyzing advanced laboratory blood panels for specific metabolic, hormonal, and systemic inflammatory factors, we isolate the exact elements impacting your neural terrain.

Whether we are engineering precision nutritional frameworks under direct CORU dietetic supervision or adjusting app-based tracking metrics for sleep architecture and recovery, your program adapts dynamically alongside your physical improvements.

You do not have to navigate early memory concerns with uncertainty. Let's look at your health story together.

${discoveryCta("Secure a 15-Minute Discovery Call", discovery)}

Learn about our ${NN_PRICING.assessmentLabel} assessment: ${assessment}

In partnership,
The NeuroNourish Clinical Team`,
        },
        {
          subject: "Your brain health deserves a tailored plan",
          body: `Dear ${name},

The brain does not experience sudden changes overnight; it sends gentle, early signals long before a point of crisis arrives. Recognizing those indicators—like a family history that causes worry or cognitive fatigue that disrupts your daily routine—is your signal to step forward.

Our personalized brain health programmes are built to surround you with continuous clinical oversight, expert coaching, and objective longitudinal monitoring. Because we maintain high-touch accountability and individualized care for every single participant, our active client cohorts are strictly capped.

Taking control of your cognitive vitality does not have to feel overwhelming. It simply requires a collaborative partnership built around your metrics and your life.

We invite you to take ownership of your long-term wellness pathways today by securing an intake conversation with our team before our upcoming cohort enrollment closes.

${discoveryCta("Complete Your Application & Book Your Call", discovery)}

In partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
      ];
    case "assessment_abandon":
      return DELAYS_HOURS.assessment_abandon.map((_, i) => ({
        subject:
          i === 0 ? "Complete your cognitive health assessment" : "Your assessment is waiting",
        body: `Hi ${name},\n\nYou viewed our Cognitive Health Assessment but didn't complete checkout. Your quiz results suggest this could be a valuable next step.\n\n${assessment}\n\nQuestions? Book a discovery call: ${discovery}`,
      }));
    case "assessment_complete":
      return DELAYS_HOURS.assessment_complete.map((_, i) => ({
        subject:
          i === 0
            ? "Your 12-month brain health programme"
            : "Build on your assessment results",
        body: `Hi ${name},\n\nYour assessment is complete. The next step is our 12-month personalised brain health programme (${NN_PRICING.programmeLabel}) — with your ${NN_PRICING.assessmentLabel} assessment fee credited if you enrol within ${NN_PRICING.assessmentCreditDays} days.\n\n${programme}\n\nBook a discovery call: ${discovery}`,
      }));
    case "programme_nurture":
      return programmeCreditExpiryEmails(lead).map(({ subject, body }) => ({ subject, body }));
    case "clinician_b2b":
      return [
        {
          subject: "Supporting your practice: Scalable lifestyle medicine for cognitive health",
          body: `Dear ${clinicianName},

Thank you for contacting the clinical liaison team at NeuroNourish.

As healthcare models face a growing volume of patients presenting with cognitive anxiety and early memory concerns, primary care schedules are under unprecedented pressure. Coordinating the intensive, continuous lifestyle modifications required to modify dementia risk profiles is a vital task, but one that traditional consultation windows cannot easily accommodate.

NeuroNourish exists to act as a secure, direct extension of your practice. We deliver a structured 12-month Personalised Brain Health Programme that manages advanced biomarker mapping, objective cognitive testing, and daily lifestyle monitoring under direct CORU dietetic supervision.

We protect your clinical workflow by absorbing the dense operational tracking time, ensuring your patients receive high-touch preventative care while placing zero admin burden on your team.

You can download our introductory clinical briefing package directly through your partner dashboard, or secure a brief introductory consultation with our medical team here:

${discoveryCta("Schedule a 10-Minute Practice Briefing", discovery)}

Sincerely,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
        {
          subject: "Objective data over assumptions: The NeuroNourish clinical framework",
          body: `Dear ${clinicianName},

In preventative neurology, long-term patient outcomes are driven by objective, continuous tracking rather than isolated or generalized wellness advice.

The NeuroNourish lifestyle intervention framework is built on robust, peer-reviewed clinical data, directly aligning multi-modal lifestyle changes with precision metabolic optimization. Our platform uses standard, validated metrics like the Montreal Cognitive Assessment (MoCA) alongside extensive laboratory blood panels to establish clear, functional baselines for every participant.

By tracking systemic biomarkers across metabolic, inflammatory, and endocrine systems over a full annual cycle, our software decision-support engine identifies distinct hidden patterns of cognitive risk. This allows our clinical team to continuously optimize nutrition, sleep architecture, and movement parameters based on measurable biological results.

We believe in complete professional transparency. We close the care loop by delivering structured, longitudinal progress reports back to your primary clinic at regular intervals, ensuring your patient's health tracking remains completely aligned.

If you would like to explore our reporting formats and data metrics, you can request an interface demonstration below:

${discoveryCta("View an Interface Walkthrough", clinics)}

Best regards,
The NeuroNourish Clinical Team`,
        },
        {
          subject: "Defining boundaries: Collaborative care without practice friction",
          body: `Dear ${clinicianName},

When integrating a supportive care program into your patient workflow, understanding clear lines of medical responsibility and clinical sovereignty is essential.

NeuroNourish functions strictly as an allied lifestyle medicine and functional nutrition provider. We do not manage acute pathology, alter primary medical prescriptions, or intervene in your core therapeutic treatments.

Your practice retains complete sovereign clinical oversight over the patient's primary medical trajectory. Our role is focused entirely on the intensive, daily execution of the modifiable lifestyle variables that support long-term brain wellness.

Furthermore, our system includes built-in safety checkpoints: if our continuous monitoring tracks any red-flag neurological indicators or unexpected biological shifts, the patient is immediately routed back to your clinic with all current data logs attached.

We act as an integrated partner to support your care, never to replace it.

${discoveryCta("Explore Clinic Partnership Pathways", clinics)}

In partnership,
The NeuroNourish Clinical Team`,
        },
        {
          subject: "Cohort enrollment: Integrating your practice for August",
          body: `Dear ${clinicianName},

As we prepare for our upcoming August clinical intake cohort launch, we are finalizing our structured referral pathways with primary care practices and specialist clinics across Ireland and the UK.

Integrating NeuroNourish into your practice requires zero hardware configuration or software installation. Partner clinics receive a dedicated digital referral node and a supply of desk-ready physical referral guides, allowing your staff to confidently route patients into a validated preventative pathway in under 60 seconds.

By automating complex data synthesis through our AI-assisted clinical reporting platform, we make comprehensive cognitive protection accessible and highly scalable.

We are currently capping the number of primary care partner practices for the upcoming cohort to maintain elite clinical supervision for every referred patient. If you would like to secure an integration slot for your clinic before our launch, let's connect for a brief 10-minute introductory call this week.

${discoveryCta("Secure an August Practice Integration Call", discovery)}

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
      ];
    case "clinician_briefing_followup":
      return clinicianBriefingFollowupEmails(lead);
    case "employer_briefing_followup":
      return employerBriefingEmails(lead);
    case "missed_discovery_call":
      return missedCallEmails(lead);
    case "missed_b2b_briefing_call":
      return missedB2BBriefingEmails(lead);
    case "discovery_post_call":
      return [
        {
          subject: "Reflecting on your brain health goals / NeuroNourish",
          body: `Dear ${name},

It was a privilege speaking with you during your discovery consultation today. Thank you for sharing your personal health history, your current goals, and the specific areas where you are seeking greater cognitive clarity.

Stepping forward to address early memory changes or quiet concerns about your long-term wellness takes deliberate focus. We want to reinforce what we discussed: your brain is built to adapt throughout your life. It is not an unchangeable system. By matching your unique data with an exact lifestyle strategy, you can protect your mental focus and maintain your long-term independence.

As a reminder, our 12-month Personalised Brain Health Programme is structured in collaborative phases. We begin with a deep biological dive—mapping your individual metabolic, hormonal, and inflammatory terrain—so every choice we make is driven by evidence, not assumptions.

We are ready to stand alongside you as your healthcare partners. If you are ready to take that next step and unlock your clinical baseline, you can secure your comprehensive assessment dashboard directly here:

${discoveryCta("Activate My Clinical Assessment Pathway", assessment)}

In collaborative partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
        {
          subject: '"Can I actually sustain a 12-month program?"',
          body: `Dear ${name},

When considering a comprehensive, 12-month health protocol, it is entirely natural to wonder: How will I fit this into my already demanding schedule? What happens if my daily compliance slips?

At NeuroNourish, we believe healthcare must be realistic to be effective. We do not design rigid, unsustainable routines or isolate you with an unmanageable set of medical instructions.

Our role as your care team is to translate complex neuroscience into simple, prioritized everyday actions tailored to your life. Through our custom mobile application, you receive bite-sized daily guidance to log meals, track sleep architecture, and monitor focus patterns seamlessly. More importantly, your dedicated personal coach provides consistent, compassionate accountability and feedback every week.

We build your programme in gradual phases. The intensive guidance during the first three months is carefully engineered to turn micro-habits into permanent behaviors, transitioning smoothly into sustainable monitoring for the rest of your year.

You do not have to perform perfectly—you simply need to remain consistent alongside a team that supports you.

${discoveryCta("Join the Upcoming August Intake Cohort", programme)}

Best regards,
The NeuroNourish Care Team`,
        },
        {
          subject: "Capped cohort enrollment: Securing your brain care infrastructure",
          body: `Dear ${name},

As we approach our upcoming August clinical launch window, our care team is currently allocating our diagnostic and coaching resources for our incoming participants.

In traditional healthcare models, we are taught to wait for conditions to fully manifest before we intervene. But when it comes to the nervous system, waiting for a visible crisis point narrows your window of maximum impact. Protecting your cognitive vitality is an asset allocation choice—much like structural financial planning for retirement.

By enrolling in our 12-month programme today, you immediately secure your assigned clinical advisory staff, your personal health coach, and your advanced laboratory data-tracking metrics.

Your brain is with you for life. Give it the care and protection it deserves. We would be honored to guide you forward.

${discoveryCta("Complete Your Programme Enrollment Here", programme)}

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
        },
      ];
    case "blood_sugar_newsletter":
      return bloodSugarNewsletterEmails(lead);
    case "gut_brain_newsletter":
      return gutBrainNewsletterEmails(lead);
    case "onboarding_welcome":
      return onboardingWelcomeEmails(lead);
    case "eoi":
      return DELAYS_HOURS.eoi.map((_, i) => ({
        subject: i === 0 ? "Start with our brain health quiz" : "Understand your brain health in 3 minutes",
        body: `Hi ${name},\n\nThank you for your interest in NeuroNourish. A great first step is our free brain health quiz:\n\n${quiz}\n\nOr book a discovery call: ${discovery}`,
      }));
  }
}

export function shouldEnrollPostDiscoveryNurture(lead: Lead): boolean {
  if (!lead.consultationCompletedAt) return false;
  const stage = lead.funnelStage ?? "";
  const postPurchase = [
    "assessment_purchased",
    "assessment_completed",
    "programme_offered",
    "programme_enrolled",
  ];
  if (postPurchase.includes(stage)) return false;
  if ((lead.revenueEur ?? 0) >= 90) return false;
  return true;
}

const CLINICIAN_BRIEFING_CANCEL_STAGES = new Set([
  "discovery_requested",
  "b2b_briefing_booked",
]);

export function shouldSkipClinicianBriefingFollowup(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (CLINICIAN_BRIEFING_CANCEL_STAGES.has(stage)) return true;
  if (lead.status === "BOOKED" || lead.status === "WON") return true;
  if (stage !== "clinician_briefing_downloaded") return true;
  return false;
}

export function isClinicianBriefingLead(lead: Lead): boolean {
  return (
    lead.segment === "clinician" ||
    lead.source === "clinics_partnership" ||
    lead.source === "clinics_briefing_pack"
  );
}

export function isEmployerBriefingLead(lead: Lead): boolean {
  return lead.segment === "employer" || lead.source === "employer_wellness";
}

const EMPLOYER_BRIEFING_CANCEL_STAGES = new Set([
  "discovery_requested",
  "b2b_briefing_booked",
]);

export function shouldSkipEmployerBriefingFollowup(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (EMPLOYER_BRIEFING_CANCEL_STAGES.has(stage)) return true;
  if (lead.status === "BOOKED" || lead.status === "WON") return true;
  if (!isEmployerBriefingLead(lead)) return true;
  return false;
}

export async function cancelEmployerBriefingFollowup(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [employer_briefing_followup]");
}

export async function cancelClinicianBriefingFollowup(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [clinician_briefing_followup]");
}

export async function cancelMissedDiscoveryCallNurture(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [missed_discovery_call]");
}

export async function cancelMissedB2BBriefingNurture(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [missed_b2b_briefing_call]");
}

const BLOOD_SUGAR_NEWSLETTER_CANCEL_STAGES = new Set([
  "discovery_requested",
  "assessment_purchased",
  "assessment_completed",
  "onboarding_started",
  "programme_offered",
  "programme_enrolled",
]);

export function shouldSkipBloodSugarNewsletter(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (BLOOD_SUGAR_NEWSLETTER_CANCEL_STAGES.has(stage)) return true;
  if (lead.status === "BOOKED" || lead.status === "WON") return true;
  const purchasedTiers = new Set(["assessment_purchased", "assessment_completed", "programme_enrolled"]);
  if (lead.qualificationTier && purchasedTiers.has(lead.qualificationTier)) return true;
  return false;
}

export async function cancelBloodSugarNewsletterSeries(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [blood_sugar_newsletter]");
}

export function shouldSkipGutBrainNewsletter(lead: Lead): boolean {
  return shouldSkipBloodSugarNewsletter(lead);
}

export async function cancelGutBrainNewsletterSeries(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [gut_brain_newsletter]");
}

/** Day 2 · Day 4 · Day 6 gut-brain educational series (interleaved with blood sugar track). */
export async function enrollGutBrainNewsletterSeries(lead: Lead) {
  if (shouldSkipGutBrainNewsletter(lead)) return { enrolled: false };
  await cancelGutBrainNewsletterSeries(lead.id);
  await enrollNeuronourishNurture(lead, "gut_brain_newsletter");
  return { enrolled: true };
}

/** Day 1 · Day 3 · Day 5 educational series for quiz completers who have not booked care. */
export async function enrollBloodSugarNewsletterSeries(lead: Lead) {
  if (shouldSkipBloodSugarNewsletter(lead)) return { enrolled: false };
  await cancelBloodSugarNewsletterSeries(lead.id);
  await enrollNeuronourishNurture(lead, "blood_sugar_newsletter");
  return { enrolled: true };
}

export function shouldSkipProgrammeNurture(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (stage === "programme_enrolled") return true;
  if ((lead.revenueEur ?? 0) >= NN_PRICING.programmeCents / 100) return true;
  if (!lead.creditExpiryDate) return true;
  if (new Date(lead.creditExpiryDate).getTime() <= Date.now()) return true;
  return false;
}

export async function cancelProgrammeNurture(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [programme_nurture]");
}

/** Day 7 intro · 7 days before expiry · 48h before expiry — tied to assessment credit window. */
const ONBOARDING_WELCOME_CANCEL_STAGES = new Set([
  "discovery_requested",
  "programme_enrolled",
]);

export function shouldSkipOnboardingWelcome(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (ONBOARDING_WELCOME_CANCEL_STAGES.has(stage)) return true;
  if ((lead.revenueEur ?? 0) >= NN_PRICING.programmeCents / 100) return true;
  if (lead.status === "BOOKED" || lead.status === "WON") return true;
  if (lead.consultationCompletedAt) return true;
  return false;
}

export async function cancelOnboardingWelcomeNurture(leadId: string) {
  await cancelSequenceTasksByPrefix(leadId, "NN nurture [onboarding_welcome]");
}

/** 5 min · 48h · 5d portal activation sequence after onboarding wizard completion. */
export async function enrollOnboardingWelcomeNurture(lead: Lead) {
  if (shouldSkipOnboardingWelcome(lead)) return { enrolled: false };

  await cancelOnboardingWelcomeNurture(lead.id);
  await enrollNeuronourishNurture(lead, "onboarding_welcome");
  return { enrolled: true };
}

export async function enrollProgrammeNurture(lead: Lead) {
  if (shouldSkipProgrammeNurture(lead)) return { enrolled: false };

  await cancelProgrammeNurture(lead.id);

  const emails = programmeCreditExpiryEmails(lead);
  if (emails.length === 0) return { enrolled: false };

  for (const step of emails) {
    await db.task.create({
      data: {
        leadId: lead.id,
        title: `NN nurture [programme_nurture]: ${step.subject}`,
        description: step.body,
        dueDate: step.dueDate,
      },
    });
  }

  await db.note.create({
    data: {
      leadId: lead.id,
      author: "Automation",
      content: `Enrolled on programme upgrade nurture (${emails.length} emails) with credit expiry tracking.`,
    },
  });

  return { enrolled: true, steps: emails.length };
}

const MISSED_DISCOVERY_CANCEL_STAGES = new Set([
  "discovery_requested",
  "assessment_purchased",
  "assessment_completed",
  "programme_offered",
  "programme_enrolled",
]);

export function shouldSkipMissedDiscoveryCallNurture(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (MISSED_DISCOVERY_CANCEL_STAGES.has(stage)) return true;
  if (lead.consultationCompletedAt) return true;
  if (lead.status === "BOOKED" && stage !== "discovery_no_show") return true;
  if (stage !== "discovery_no_show") return true;
  return false;
}

const MISSED_B2B_BRIEFING_CANCEL_STAGES = new Set([
  "discovery_requested",
  "b2b_briefing_booked",
]);

export function shouldSkipMissedB2BBriefingNurture(lead: Lead): boolean {
  const stage = lead.funnelStage ?? "";
  if (MISSED_B2B_BRIEFING_CANCEL_STAGES.has(stage)) return true;
  if (lead.consultationCompletedAt) return true;
  if (lead.status === "BOOKED" && stage !== "b2b_briefing_no_show") return true;
  if (stage !== "b2b_briefing_no_show") return true;
  if (!isClinicianBriefingLead(lead)) return true;
  return false;
}

/** Enroll 3-step missed B2B practice briefing sequence (2h · 48h · 5d). */
export async function enrollMissedB2BBriefingNurture(lead: Lead) {
  if (!isClinicianBriefingLead(lead)) return { enrolled: false };
  if (shouldSkipMissedB2BBriefingNurture(lead)) return { enrolled: false };
  await cancelMissedB2BBriefingNurture(lead.id);
  await cancelClinicianBriefingFollowup(lead.id);
  await enrollNeuronourishNurture(lead, "missed_b2b_briefing_call");
  return { enrolled: true };
}

/** Enroll 3-step missed discovery call sequence (2h · 48h · 5d). */
export async function enrollMissedDiscoveryCallNurture(lead: Lead) {
  if (shouldSkipMissedDiscoveryCallNurture(lead)) return { enrolled: false };
  await cancelMissedDiscoveryCallNurture(lead.id);
  await cancelSequenceTasksByPrefix(lead.id, "NN nurture [discovery_post_call]");
  await enrollNeuronourishNurture(lead, "missed_discovery_call");
  return { enrolled: true };
}

/** Enroll 3-step enterprise cold briefing when employer inquiry goes cold (Day 2 · 5 · 9). */
export async function enrollEmployerBriefingFollowup(lead: Lead) {
  if (!isEmployerBriefingLead(lead)) return { enrolled: false };
  if (shouldSkipEmployerBriefingFollowup(lead)) return { enrolled: false };

  await cancelEmployerBriefingFollowup(lead.id);
  await enrollNeuronourishNurture(lead, "employer_briefing_followup");
  return { enrolled: true };
}

/** Alias for B2B automation hooks — enroll corporate partner cold briefing nurture. */
export async function enrollEnterpriseBriefingNurture(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { enrolled: false };

  console.log(`[B2B AUTOMATION] Enrolling corporate partner into cold briefing track: ${leadId}`);
  return enrollEmployerBriefingFollowup(lead);
}

/** Cancel pending enterprise cold briefing tasks when a corporate lead books. */
export async function cancelEnterpriseBriefingNurture(leadId: string) {
  await cancelEmployerBriefingFollowup(leadId);
}

/** Instant delivery when a clinician requests or downloads the institutional briefing pack. */
export async function enrollClinicianBriefingFollowup(lead: Lead) {
  if (!isClinicianBriefingLead(lead)) return { enrolled: false };
  if (shouldSkipClinicianBriefingFollowup(lead)) return { enrolled: false };

  await cancelClinicianBriefingFollowup(lead.id);
  await enrollNeuronourishNurture(lead, "clinician_briefing_followup");
  return { enrolled: true };
}

/** Instant delivery when a clinician requests or downloads the institutional briefing pack. */
export async function sendBriefingPackDeliveryEmail(lead: Lead) {
  const name = clinicianSalutation(lead);
  const clinics = `${siteUrl()}/clinics`;
  const referralCard = `${siteUrl()}/clinics/referral-card`;
  const subject = "Your NeuroNourish institutional clinical briefing pack";
  const body = `Dear ${name},

Thank you for requesting our institutional briefing materials for the NeuroNourish 12-month Personalised Brain Health Programme.

You can review the clinical partnership overview, referral workflow, and desk-ready patient materials here:

${discoveryCta("Open Healthcare Partnership Overview", clinics)}

${discoveryCta("Download Printable Clinical Referral Card", referralCard)}

Our medical liaison team is available for a brief 10-minute practice briefing if you would like to walk through reporting structures or August cohort integration.

${discoveryCta("Schedule Your 10-Minute Clinical Briefing Call", `${siteUrl()}/discovery`)}

Best regards,
Emer Sexton
Founder & CEO, NeuroNourish`;

  const result = await sendEmail({
    to: lead.email,
    subject,
    body,
    category: "transactional",
    htmlOptions: {
      cta: { label: "Open Healthcare Partnership Overview", href: clinics },
      showDanielSignature: false,
    },
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: result.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
      description: result.sent
        ? "Clinical briefing pack delivery email sent"
        : "Clinical briefing pack delivery email logged",
      metadata: JSON.stringify({ subject, sent: result.sent, error: result.error }),
    },
  });

  return result;
}

export async function enrollPostDiscoveryNurtureIfEligible(lead: Lead) {
  if (!shouldEnrollPostDiscoveryNurture(lead)) return { enrolled: false };
  await cancelSequenceTasksByPrefix(lead.id, "NN nurture [discovery_post_call]");
  await enrollNeuronourishNurture(lead, "discovery_post_call");
  return { enrolled: true };
}

export async function enrollNeuronourishNurture(lead: Lead, key: NurtureKey) {
  if (key === "quiz_complete") {
    await cancelSequenceTasksByPrefix(lead.id, "NN nurture [quiz_abandon]");
  }
  if (key === "assessment_complete" || key === "programme_nurture") {
    await cancelSequenceTasksByPrefix(lead.id, "NN nurture [discovery_post_call]");
  }
  if (key === "discovery_post_call") {
    await cancelClinicianBriefingFollowup(lead.id);
    await cancelEmployerBriefingFollowup(lead.id);
    await cancelMissedDiscoveryCallNurture(lead.id);
    await cancelMissedB2BBriefingNurture(lead.id);
    await cancelBloodSugarNewsletterSeries(lead.id);
    await cancelGutBrainNewsletterSeries(lead.id);
  }

  await db.lead.update({
    where: { id: lead.id },
    data: { nurtureEnrolled: true },
  });

  const emails = emailBodies(key, lead);
  for (const [index, step] of emails.entries()) {
    const hours = DELAYS_HOURS[key][index] ?? 24;
    const dueDate = new Date(Date.now() + hours * 60 * 60 * 1000);
    await db.task.create({
      data: {
        leadId: lead.id,
        title: `NN nurture [${key}]: ${step.subject}`,
        description: step.body,
        dueDate,
      },
    });
  }

  if (key === "quiz_abandon" && lead.phone) {
    void sendSms(
      lead.phone,
      `Hi ${firstName(lead)}, finish your NeuroNourish brain health quiz: ${siteUrl()}/quiz`,
      { leadId: lead.id },
    );
  }

  await db.note.create({
    data: {
      leadId: lead.id,
      author: "Automation",
      content: `Enrolled on NeuroNourish nurture sequence: ${key} (${emails.length} emails).`,
    },
  });
}

export function parseNurtureKeyFromTaskTitle(title: string): NurtureKey | null {
  const match = title.match(/^NN nurture \[([^\]]+)\]:/);
  if (!match) return null;
  return match[1] as NurtureKey;
}

/** Re-enroll quiz_partial leads that missed task scheduling (fallback safety net). */
export async function ensureQuizPartialDropOffNurture() {
  const leads = await db.lead.findMany();
  let enrolled = 0;

  for (const lead of leads) {
    if (lead.funnelStage !== "quiz_partial") continue;

    const openNurture = await db.task.findMany({
      where: {
        leadId: lead.id,
        completed: false,
        title: { startsWith: "NN nurture [quiz_abandon]" },
      },
    });
    if (openNurture.length > 0) continue;

    const completedNurture = await db.task.findFirst({
      where: {
        leadId: lead.id,
        completed: true,
        title: { startsWith: "NN nurture [quiz_abandon]" },
      },
    });
    if (completedNurture) continue;

    const ageHours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 0.5) continue;

    await enrollNeuronourishNurture(lead, "quiz_abandon");
    enrolled++;
  }

  return { enrolled };
}

export async function sendPartialQuizEmail1(email: string, name: string, lead?: Lead) {
  const body = emailBodies("quiz_abandon", lead ?? ({ firstName: name } as Lead));
  return sendEmail({
    to: email,
    subject: body[0].subject,
    body: body[0].body,
    category: "marketing",
  });
}

export async function sendPartialQuizEmail2(email: string, name: string, lead?: Lead) {
  const body = emailBodies("quiz_abandon", lead ?? ({ firstName: name } as Lead));
  return sendEmail({
    to: email,
    subject: body[1].subject,
    body: body[1].body,
    category: "marketing",
  });
}

export async function sendPartialQuizEmail3(email: string, name: string, lead?: Lead) {
  const body = emailBodies("quiz_abandon", lead ?? ({ firstName: name } as Lead));
  return sendEmail({
    to: email,
    subject: body[2].subject,
    body: body[2].body,
    category: "marketing",
  });
}

function clinicianFollowUpEmail(index: 0 | 1 | 2 | 3, email: string, lead?: Lead) {
  const resolvedLead =
    lead ??
    ({
      email,
      lastName: email.includes("@") ? undefined : email,
      firstName: "Clinical",
    } as Lead);
  const body = emailBodies("clinician_briefing_followup", resolvedLead)[index];
  return sendEmail({
    to: email,
    subject: body.subject,
    body: body.body,
    category: "marketing",
    htmlOptions: nurtureHtmlOptionsFromBody(body.body),
  });
}

function nurtureHtmlOptionsFromBody(body: string) {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    const label = lines[i]?.trim() ?? "";
    const href = lines[i + 1]?.trim() ?? "";
    if (
      href.startsWith("http") &&
      label.length > 0 &&
      label.length < 80 &&
      !label.includes("http")
    ) {
      return { cta: { label, href }, showDanielSignature: false };
    }
  }
  return undefined;
}

export async function sendClinicianFollowUpEmail1(email: string, lastName: string, lead?: Lead) {
  return clinicianFollowUpEmail(
    0,
    email,
    lead ?? ({ lastName, firstName: "Clinical" } as Lead),
  );
}

export async function sendClinicianFollowUpEmail2(email: string, lastName: string, lead?: Lead) {
  return clinicianFollowUpEmail(
    1,
    email,
    lead ?? ({ lastName, firstName: "Clinical" } as Lead),
  );
}

export async function sendClinicianFollowUpEmail3(email: string, lastName: string, lead?: Lead) {
  return clinicianFollowUpEmail(
    2,
    email,
    lead ?? ({ lastName, firstName: "Clinical" } as Lead),
  );
}

export async function sendClinicianFollowUpEmail4(email: string, lastName: string, lead?: Lead) {
  return clinicianFollowUpEmail(
    3,
    email,
    lead ?? ({ lastName, firstName: "Clinical" } as Lead),
  );
}

export async function sendMissedCallEmail1(email: string, name: string, lead?: Lead) {
  const resolved = lead ?? ({ firstName: name, email } as Lead);
  const body = missedCallEmails(resolved)[0];
  return sendEmail({
    to: email,
    subject: body.subject,
    body: body.body,
    category: "marketing",
    htmlOptions: nurtureHtmlOptionsFromBody(body.body),
  });
}

export async function sendMissedCallEmail2(email: string, name: string, lead?: Lead) {
  const resolved = lead ?? ({ firstName: name, email } as Lead);
  const body = missedCallEmails(resolved)[1];
  return sendEmail({
    to: email,
    subject: body.subject,
    body: body.body,
    category: "marketing",
    htmlOptions: nurtureHtmlOptionsFromBody(body.body),
  });
}

export async function sendMissedCallEmail3(email: string, name: string, lead?: Lead) {
  const resolved = lead ?? ({ firstName: name, email } as Lead);
  const body = missedCallEmails(resolved)[2];
  return sendEmail({
    to: email,
    subject: body.subject,
    body: body.body,
    category: "marketing",
    htmlOptions: nurtureHtmlOptionsFromBody(body.body),
  });
}

export async function sendNeuronourishInstantEmail(
  lead: Lead,
  subject: string,
  body: string,
) {
  await sendEmail({ to: lead.email, subject, body, category: "transactional" });
}

/** Auto-response when an enterprise / employer wellness inquiry is captured. */
export async function sendEmployerWellnessAutoResponse(lead: Lead) {
  const name = firstName(lead);
  const discovery = `${siteUrl()}/discovery`;
  const body = NN_B2B_EMPLOYER_AUTO_RESPONSE.body
    .replace("[Contact Name]", name)
    .replace(
      "[ Schedule a Corporate Wellness Briefing Call ]",
      `${NN_B2B_EMPLOYER_AUTO_RESPONSE.ctaLabel}\n${discovery}`,
    );

  const result = await sendEmail({
    to: lead.email,
    subject: NN_B2B_EMPLOYER_AUTO_RESPONSE.subject,
    body,
    category: "transactional",
    htmlOptions: {
      cta: {
        label: NN_B2B_EMPLOYER_AUTO_RESPONSE.ctaLabel,
        href: discovery,
      },
      showDanielSignature: false,
    },
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: result.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
      description: result.sent
        ? "Employer wellness auto-response sent"
        : "Employer wellness auto-response logged",
      metadata: JSON.stringify({
        subject: NN_B2B_EMPLOYER_AUTO_RESPONSE.subject,
        sent: result.sent,
        error: result.error,
      }),
    },
  });

  await db.note.create({
    data: {
      leadId: lead.id,
      author: "Automation",
      content: "Employer / corporate wellness auto-response email dispatched.",
    },
  });

  return result;
}

const ASSESSMENT_INSTRUCTIONS_SUBJECT =
  "Your Next Step: Scientific Cognitive Baseline Assessment Instructions";

function assessmentInstructionsBody(
  firstName: string,
  expiryDateString: string,
  testUrl: string,
) {
  const name = firstName.trim() || "there";
  return `Dear ${name},

Thank you for choosing to deepen your understanding of your brain health by purchasing our comprehensive clinical baseline evaluation. This assessment represents a vital step forward in translating your unique biological data into a structured path toward long-term mental clarity.

We utilize a scientifically validated cognitive testing panel to map your brain's processing speed, working memory, and functional focus areas. To ensure your medical data remains fresh and accurately aligns with your upcoming lifestyle modifications, your testing credit includes a structured 30-day activation window.

Your personal evaluation link is valid until: ${expiryDateString}

How to prepare for your assessment:
• Secure a quiet, distraction-free environment for approximately 30 to 45 minutes.
• Use a standard laptop or desktop computer with a reliable internet connection (smartphones are not supported for this specific evaluation).
• Approach the questions with a rested mind—this is not a test to pass or fail, but a friendly, objective baseline to guide your personalized program structure.

When you are ready, please use the secure access link in this email to launch your session.

Once you complete the online evaluation, your raw data will flow securely into our clinical workflow platform. Our care team will synthesize your cognitive scores alongside your biomarker history to finalize your personalized 12-month roadmap.

If you have any questions or require structural support setting up your testing environment, simply reply directly to this message.

In collaborative partnership,

Emer Sexton
Founder & CEO, NeuroNourish`;
}

/** Fires immediately after assessment_purchased (Stripe webhook). */
export async function sendAssessmentInstructionsEmail(input: {
  email: string;
  firstName: string;
  expiryDateString: string;
  testUrl?: string;
  leadId?: string;
}) {
  const testUrl =
    input.testUrl ??
    runtimeEnv("CNS_VITAL_SIGNS_TEST_URL") ??
    "https://cnsvitalsigns.com";
  const body = assessmentInstructionsBody(
    input.firstName,
    input.expiryDateString,
    testUrl,
  );

  const result = await sendEmail({
    to: input.email,
    subject: ASSESSMENT_INSTRUCTIONS_SUBJECT,
    body,
    category: "transactional",
    htmlOptions: {
      cta: {
        label: "Launch Your Cognitive Baseline Assessment",
        href: testUrl,
      },
      preheader: `Complete your assessment by ${input.expiryDateString}`,
      showDanielSignature: false,
    },
  });

  if (input.leadId) {
    await db.activity.create({
      data: {
        leadId: input.leadId,
        type: result.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
        description: result.sent
          ? "Cognitive assessment instructions email sent"
          : "Cognitive assessment instructions email logged (dry run or Resend unavailable)",
        metadata: JSON.stringify({
          subject: ASSESSMENT_INSTRUCTIONS_SUBJECT,
          expiryDate: input.expiryDateString,
          testUrl,
          sent: result.sent,
          error: result.error,
        }),
      },
    });
  }

  return result;
}
