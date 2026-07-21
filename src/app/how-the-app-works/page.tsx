import Link from "next/link";
import {
  AppPreviewVisual,
  CheckList,
  PageContainer,
  PageHeader,
} from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_APP } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("app");

export default function HowTheAppWorksPage() {
  return (
    <NeuroNourishShell>
      <PageContainer width="xl" className="py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <PageHeader
              eyebrow={NN_APP.eyebrow}
              headline={NN_APP.headline}
              subtext={NN_APP.subtext}
            />
            <div className="mt-6">
              <CheckList items={NN_APP.benefits} />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink/65">
              The companion app is not available for public download — access is included for
              12-month programme clients.
            </p>
            <div className="mt-8 flex flex-col items-start gap-1.5">
              <GoldButton href="/programme">{NN_APP.cta}</GoldButton>
              <span className="text-xs text-ink/55">{NN_APP.ctaHint}</span>
              <Link href="/shop/light-programme" className="nn-text-link mt-3 text-sm">
                View the Light programme →
              </Link>
            </div>
          </div>
              <AppPreviewVisual variant="screenshot" />
        </div>
      </PageContainer>
    </NeuroNourishShell>
  );
}
