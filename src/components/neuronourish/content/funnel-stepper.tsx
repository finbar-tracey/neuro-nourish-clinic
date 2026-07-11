type Step = "quiz" | "assessment" | "programme";

const STEPS: { id: Step; label: string }[] = [
  { id: "quiz", label: "Quiz" },
  { id: "assessment", label: "Assessment" },
  { id: "programme", label: "Programme" },
];

export function FunnelStepper({ active }: { active: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.id === active);

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
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                    isActive
                      ? "bg-gold text-deep-slate"
                      : isComplete
                        ? "bg-gold/20 text-slate-blue"
                        : "border border-mist bg-white text-ink/45"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`h-px flex-1 ${isComplete ? "bg-gold/70" : "bg-mist"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  isActive ? "text-slate-blue" : "text-ink/50"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
