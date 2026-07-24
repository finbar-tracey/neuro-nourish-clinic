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
          <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
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
          <path
            d="M12 21c-4.5-2.8-7.5-6.2-7.5-10.2A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 7.5 4.3C19.5 14.8 16.5 18.2 12 21z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
