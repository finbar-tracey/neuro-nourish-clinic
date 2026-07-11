import {
  FileText,
  MessageSquare,
  Phone,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  ContentCard,
  Section,
  SectionCta,
  SectionHeader,
} from "@/components/landing/layout";
import { META_LP_OFFER_ITEMS } from "@/lib/meta-lp-copy";

const OFFER_ICONS = [
  MessageSquare,
  Search,
  FileText,
  UserCheck,
  Shield,
  Phone,
] as const;

export function OfferSection() {
  return (
    <Section className="bg-brand-cream">
      <SectionHeader
        eyebrow="What You Get"
        title="Your Free Enquiry Includes"
        description="No hidden fees for the consultation. No pressure to proceed. Clear options so you can decide with confidence."
      />

      <div className="mb-8 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 text-center text-sm text-navy">
        <strong className="font-semibold">Today&apos;s enquiries</strong> are reviewed
        personally by Daniel — typical response within{" "}
        <strong className="text-gold-ink">2 hours</strong> (Mon–Sat). Introducer only —
        subject to status.
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {META_LP_OFFER_ITEMS.map(({ title, desc }, index) => {
          const Icon = OFFER_ICONS[index] ?? MessageSquare;
          return (
            <ContentCard key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy">
                <Icon className="h-5 w-5 text-gold-ink" />
              </div>
              <div>
                <h3 className="mb-1.5 font-semibold text-navy">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            </ContentCard>
          );
        })}
      </div>

      <SectionCta
        label="Start Free Enquiry"
        note="Takes 2 minutes · Typical response within 2 hours"
        showPhone
      />
    </Section>
  );
}
