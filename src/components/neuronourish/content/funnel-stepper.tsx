import Link from "next/link";

type Step = "quiz" | "assessment" | "programme";

const STEPS: { id: Step; label: string; href: string }[] = [
  { id: "quiz", label: "Quiz", href: "/quiz" },
  { id: "assessment", label: "Assessment", href: "/shop/cognitive-assessment" },
  { id: "programme", label: "Programme", href: "/programme" },
];

export function FunnelStepper({
  active,
  leadId,
}: {
  active: Step;
  leadId?: string;
}) {
  const activeIndex = STEPS.findIndex((s) => s.id === active);
  const withLead = (href: string) =>
    leadId ? `${href}?leadId=${encodeURIComponent(leadId)}` : href;

  return (
    <nav aria-label="Your journey progress" className="mx-auto max-w-md">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`h-px flex-1 ${isComplete || isActive ? "bg-gold/70" : "bg-mist"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
                <Link
                  href={withLead(step.href)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition hover:opacity-90 ${
                    isActive
                      ? "bg-gold text-deep-slate"
                      : isComplete
                        ? "bg-gold/20 text-slate-blue"
                        : "border border-mist bg-white text-ink/45"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${step.label} step`}
                >
                  {isComplete ? "✓" : index + 1}
                </Link>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`h-px flex-1 ${isComplete ? "bg-gold/70" : "bg-mist"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <Link
                href={withLead(step.href)}
                className={`text-[10px] uppercase tracking-wider transition hover:text-slate-blue ${
                  isActive ? "text-slate-blue" : "text-ink/50"
                }`}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
