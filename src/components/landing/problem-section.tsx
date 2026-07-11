import type { AdAngle } from "@/lib/ad-angles";
import { metaLpAngleMarketing } from "@/lib/meta-lp-copy";
import { Section, SectionCta, SectionHeader } from "@/components/landing/layout";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Props = { angle?: AdAngle };

export function ProblemSection({ angle = "default" }: Props) {
  const { painHeadline, painIntro, painBullets, solutionBridge } =
    metaLpAngleMarketing(angle);

  return (
    <Section className="border-b border-slate-200 bg-white">
      <SectionHeader
        eyebrow="The Challenge"
        title={painHeadline}
        description={painIntro}
      />

      <ul className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {painBullets.map((bullet) => (
          <li
            key={bullet}
            className="flex gap-4 rounded-2xl border border-red-100 bg-red-50/60 p-6"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm leading-relaxed text-slate-700">{bullet}</p>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-green-200 bg-green-50/70 p-6 text-center md:p-8">
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          The Broker Difference
        </div>
        <p className="text-base leading-relaxed text-slate-700">{solutionBridge}</p>
      </div>

      <SectionCta
        label="Start Free Enquiry →"
        note="2-minute form · Daniel responds within 2 hours"
        showPhone
      />
    </Section>
  );
}
