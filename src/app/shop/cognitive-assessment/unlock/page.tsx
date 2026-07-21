import { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { CnsUnlockForm } from "@/app/shop/cognitive-assessment/unlock/unlock-form";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Unlock Cognitive Assessment | NeuroNourish",
  description:
    "Confirm your date of birth to unlock your CNS Vital Signs cognitive assessment test link.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${getSiteUrl()}/shop/cognitive-assessment/unlock` },
};

export default function CnsUnlockPage() {
  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="md">
          <SectionHeader
            eyebrow="Cognitive assessment"
            headline="Unlock your test"
            subtext="One detail is required before we can issue your CNS Vital Signs assessment — your date of birth for age-normed scoring."
            align="center"
          />
          <Suspense fallback={<p className="mt-10 text-center text-sm text-ink/60">Loading…</p>}>
            <CnsUnlockForm />
          </Suspense>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
