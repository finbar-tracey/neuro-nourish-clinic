import { Clock, Lock, ShieldCheck, ThumbsUp } from "lucide-react";
import {
  ContentCard,
  Section,
  SectionCta,
  SectionHeader,
} from "@/components/landing/layout";

const GUARANTEES = [
  {
    icon: ThumbsUp,
    title: "No obligation",
    desc: "Request a quote with zero commitment to proceed.",
  },
  {
    icon: ShieldCheck,
    title: "No hard credit check",
    desc: "Enquiring won't affect your credit score.",
  },
  {
    icon: Clock,
    title: "2-hour response",
    desc: "Daniel personally reviews every enquiry the same day.",
  },
  {
    icon: Lock,
    title: "Your data stays private",
    desc: "Secure form — we never share your details with third parties.",
  },
];

export function RiskReversalSection() {
  return (
    <Section className="border-y border-slate-200 bg-white">
      <SectionHeader
        title="Zero Risk to Enquire"
        description="We remove every barrier — so the only thing left is your decision."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {GUARANTEES.map(({ icon: Icon, title, desc }) => (
          <ContentCard
            key={title}
            className="flex flex-col items-center border-brand-cream bg-brand-cream p-6 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15">
              <Icon className="h-6 w-6 text-gold-ink" />
            </div>
            <h3 className="mb-2 font-semibold text-navy">{title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
          </ContentCard>
        ))}
      </div>

      <SectionCta
        label="Enquire With Zero Risk"
        note="No obligation · No hard credit check"
      />
    </Section>
  );
}
