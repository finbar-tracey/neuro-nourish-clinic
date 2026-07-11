import {
  Building2,
  Briefcase,
  Clock,
  Globe,
  Gavel,
  Hammer,
  TrendingUp,
} from "lucide-react";
import { AD_ANGLES, type AdAngle } from "@/lib/ad-angles";
import {
  ContentCard,
  Section,
  SectionCta,
  SectionHeader,
} from "@/components/landing/layout";
import { cn } from "@/lib/utils";

const USE_CASES = [
  {
    icon: Gavel,
    title: "Auction Purchases",
    benefit: "Broker-led enquiries so you can bid with clearer funding options",
    stat: "Specialist auction lenders",
  },
  {
    icon: Briefcase,
    title: "Business/Investment",
    benefit: "Finance for business and investment property purchases",
    stat: "Business purposes only",
  },
  {
    icon: Hammer,
    title: "Refurbishment",
    benefit: "Finance for properties long-term lenders often decline",
    stat: "Subject to status",
  },
  {
    icon: Building2,
    title: "Development",
    benefit: "Staged drawdowns aligned to your build schedule",
    stat: "Light & heavy works",
  },
  {
    icon: TrendingUp,
    title: "Investment & HMO",
    benefit: "Complex portfolios and multi-unit acquisitions",
    stat: "Capital raise & refinance",
  },
  {
    icon: Globe,
    title: "International Investors",
    benefit: "UK property finance for overseas and expat clients",
    stat: "10+ countries",
  },
];

export function UseCasesSection({ angle = "default" }: { angle?: AdAngle }) {
  const highlight = AD_ANGLES[angle].highlightUseCase;

  return (
    <Section className="bg-slate-50">
      <SectionHeader
        eyebrow="The Solution"
        title="Property Finance for Every Scenario"
        description="We introduce your enquiry to 200+ lenders — broker-led search, not a single bank product."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map(({ icon: Icon, title, benefit, stat }) => {
          const isHighlighted = highlight === title;
          const Card = (
            <ContentCard
              className={cn(
                "h-full transition hover:shadow-md",
                isHighlighted && "border-gold ring-2 ring-gold/20",
              )}
            >
              {isHighlighted && (
                <span className="mb-4 inline-block rounded-full bg-gold px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                  Your scenario — free enquiry
                </span>
              )}
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10">
                <Icon className="h-5 w-5 text-gold-ink" />
              </div>
              <h3 className="mb-2 font-semibold text-navy">{title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                {benefit}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-ink">
                <Clock className="h-3.5 w-3.5" />
                {stat}
              </p>
            </ContentCard>
          );

          return isHighlighted ? (
            <a
              key={title}
              href="#quote-form"
              className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {Card}
            </a>
          ) : (
            <div key={title}>{Card}</div>
          );
        })}
      </div>

      <SectionCta label="Start Enquiry for Your Scenario" showPhone />
    </Section>
  );
}
