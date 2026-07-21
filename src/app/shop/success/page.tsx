import Link from "next/link";
import { HighlightList, PageContainer } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import { db } from "@/lib/db";
import { getShopProduct } from "@/lib/neuronourish-shop";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  searchParams: Promise<{ product?: string; leadId?: string; session_id?: string }>;
};

export const metadata = buildPageMetadata({
  title: "Purchase confirmed | NeuroNourish",
  description: "Your NeuroNourish purchase is confirmed. Check your email for next steps.",
  path: "/shop/success",
});

type AssessmentSuccessState = "test_sent" | "pending_dob" | "manual" | "default";

function assessmentSuccessCopy(state: AssessmentSuccessState): {
  headline: string;
  body: string;
  steps: string[];
} {
  switch (state) {
    case "test_sent":
      return {
        headline: "Your assessment test is ready",
        body: "Check your email for CNS Vital Signs instructions and your secure test link. Complete the assessment within your credit window.",
        steps: [
          "Open the testing instructions in your inbox",
          "Complete the CNS assessment on a quiet computer",
          "We'll email when your clinician summary is ready to review",
        ],
      };
    case "pending_dob":
      return {
        headline: "One detail left to unlock your test",
        body: "Your payment is confirmed. Confirm your date of birth so we can issue your age-normed CNS Vital Signs assessment.",
        steps: [
          "Unlock with your date of birth",
          "Watch for assessment instructions by email",
          "Complete the test within your credit window",
        ],
      };
    case "manual":
      return {
        headline: "Purchase confirmed — our team will issue your test",
        body: "Your payment went through. Automated test issuing is being finalised, so a care team member will send your CNS link shortly.",
        steps: [
          "Keep an eye on your inbox",
          "Reply to any care-team email if you need help",
          "Book a discovery call if you have questions",
        ],
      };
    default:
      return {
        headline: "Assessment purchase confirmed",
        body: "Thank you. Check your email for next steps for your cognitive assessment.",
        steps: [
          "Check your inbox for confirmation",
          "Complete any unlock steps if prompted",
          "Explore programme tiers when you're ready",
        ],
      };
  }
}

export default async function ShopSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const product = getShopProduct(params.product ?? "");
  const isAssessment = product?.slug === "cognitive-assessment";

  let assessmentState: AssessmentSuccessState = "default";
  let unlockHref: string | null = null;

  if (isAssessment && params.leadId) {
    const lead = await db.lead.findUnique({ where: { id: params.leadId } });
    unlockHref = `/shop/cognitive-assessment/unlock?leadId=${encodeURIComponent(params.leadId)}`;
    if (lead) {
      if (lead.cnsRemoteId && lead.cnsTestUrl && lead.cnsStatus === "awaiting_report") {
        assessmentState = "test_sent";
      } else if (
        !lead.dateOfBirth ||
        lead.cnsStatus === "pending_dob"
      ) {
        assessmentState = "pending_dob";
      } else if (lead.cnsStatus === "failed" || lead.cnsLastError?.includes("CNSVS_LIVE")) {
        assessmentState = "manual";
      } else if (lead.cnsStatus === "awaiting_report" || lead.cnsStatus === "test_sent") {
        assessmentState = "test_sent";
      }
    }
  }

  const assessmentCopy = isAssessment ? assessmentSuccessCopy(assessmentState) : null;
  const headline = assessmentCopy?.headline ?? product?.successHeadline ?? "Purchase confirmed";
  const body =
    assessmentCopy?.body ??
    product?.successBody ??
    "Thank you. Our care team will follow up by email with next steps.";
  const nextSteps =
    assessmentCopy?.steps ??
    product?.successNextSteps ?? [
      "Check your inbox for confirmation",
      "Book a discovery call if you have questions",
    ];

  const onboardingHref = params.leadId
    ? `/onboarding?leadId=${encodeURIComponent(params.leadId)}`
    : "/onboarding";
  const showOnboarding =
    !isAssessment &&
    (product?.funnelStage === "assessment_purchased" ||
      product?.funnelStage === "programme_enrolled");

  const primaryIsUnlock = assessmentState === "pending_dob" && unlockHref;

  return (
    <NeuroNourishShell>
      <PageContainer width="md" className="py-16 text-center">
        <SectionEyebrow>Shop</SectionEyebrow>
        <h1 className="mt-3 font-display text-3xl text-deep-slate">{headline}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">{body}</p>
        <div className="mx-auto mt-6 max-w-sm text-left">
          <HighlightList items={nextSteps} />
        </div>
        {primaryIsUnlock ? (
          <GoldButton href={unlockHref!} className="mt-8">
            Unlock your assessment
          </GoldButton>
        ) : showOnboarding ? (
          <GoldButton href={onboardingHref} className="mt-8">
            Continue to onboarding
          </GoldButton>
        ) : (
          <GoldButton href="/shop" className="mt-8">
            Back to shop
          </GoldButton>
        )}
        {unlockHref && assessmentState !== "pending_dob" ? (
          <Link href={unlockHref} className="mt-4 block text-sm text-slate-blue underline">
            Update assessment details
          </Link>
        ) : null}
        <Link href="/discovery" className="mt-4 block text-sm text-slate-blue underline">
          Book a discovery call
        </Link>
        <Link href="/shop" className="mt-3 block text-sm text-slate-blue underline">
          Browse shop
        </Link>
      </PageContainer>
    </NeuroNourishShell>
  );
}
