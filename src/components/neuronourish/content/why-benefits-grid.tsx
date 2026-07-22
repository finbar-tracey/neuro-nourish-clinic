import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import type { WhyBenefit } from "@/lib/neuronourish-copy";
import { NN_WHY } from "@/lib/neuronourish-copy";

function BenefitIcon({ icon }: { icon: WhyBenefit["icon"] }) {
  const className = "h-5 w-5 text-gold";

  switch (icon) {
    case "science":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "programme":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "clinical":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l7 4v6c0 4.2-3 7.4-7 8-4-.6-7-3.8-7-8V7l7-4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "progress":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 18V6M10 18V10M16 18V8M22 18V4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "support":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.5 19c.8-3 3-5 5.5-5s4.7 2 5.5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13 19c.5-2.2 2-3.5 3.8-3.5 1.5 0 2.8.9 3.5 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "flexible":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function WhyBenefitsGrid() {
  return (
    <NnCardGrid className="mt-10">
      {NN_WHY.benefits.map((benefit) => (
        <NnCard
          key={benefit.title}
          icon={<BenefitIcon icon={benefit.icon} />}
          title={benefit.title}
          body={benefit.description}
        />
      ))}
    </NnCardGrid>
  );
}
