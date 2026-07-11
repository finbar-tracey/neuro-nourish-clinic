import Link from "next/link";
import { ClinicalReferralCardPreview } from "@/components/neuronourish/content/clinical-referral-card";
import { PrintReferralCardButton } from "@/components/neuronourish/content/print-referral-card-button";
import { PageContainer } from "@/components/neuronourish/content";
import { NeuroNourishShell, OutlineButton } from "@/components/neuronourish/shell";
import { NN_CLINICS } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = {
  ...buildNeuronourishMetadata("clinics"),
  title: "Clinical Referral Card | NeuroNourish",
  robots: { index: false, follow: false },
};

export default function ClinicalReferralCardPage() {
  return (
    <NeuroNourishShell>
      <PageContainer width="xl" className="py-10 print:py-0">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              {NN_CLINICS.eyebrow}
            </p>
            <h1 className="nn-display-section mt-1 text-slate-blue">Clinical referral card</h1>
            <p className="mt-2 max-w-xl text-sm text-ink/70">
              DL-format desk card for GP consulting rooms and practice manager briefings. Print
              double-sided on 350gsm matte stock.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <OutlineButton href="/clinics">← Back to partnerships</OutlineButton>
            <PrintReferralCardButton />
          </div>
        </div>

        <ClinicalReferralCardPreview />

        <p className="mt-8 text-center text-xs text-ink/60 print:hidden">
          Need bulk printing?{" "}
          <Link href="/contact" className="nn-text-link">
            Contact the partnerships team
          </Link>
        </p>
      </PageContainer>
    </NeuroNourishShell>
  );
}
