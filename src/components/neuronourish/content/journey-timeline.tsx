import { NnCard, NnCardGrid, nnCardGridColumns } from "@/components/neuronourish/content/nn-card";
import { NN_JOURNEY } from "@/lib/neuronourish-copy";

function groupTimelineByPhase() {
  const groups: { phase: string; steps: (typeof NN_JOURNEY.timeline)[number][] }[] = [];

  for (const step of NN_JOURNEY.timeline) {
    const existing = groups.find((group) => group.phase === step.phase);
    if (existing) {
      existing.steps.push(step);
    } else {
      groups.push({ phase: step.phase, steps: [step] });
    }
  }

  return groups;
}

export function JourneyTimeline() {
  const phases = groupTimelineByPhase();

  return (
    <div className="space-y-10 lg:space-y-12">
      {phases.map((group, groupIndex) => (
        <div key={group.phase}>
          <p className="nn-eyebrow text-gold">{group.phase}</p>
          <NnCardGrid
            as="ol"
            className="mt-4"
            columns={nnCardGridColumns(group.steps.length)}
          >
            {group.steps.map((step) => (
              <NnCard key={step.id} as="li">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-ivory font-display text-sm text-slate-blue">
                    {step.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="nn-display-card text-slate-blue">{step.title}</h3>
                      <span className="nn-badge">{step.timing}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/75">{step.summary}</p>
                  </div>
                </div>
              </NnCard>
            ))}
          </NnCardGrid>
          {groupIndex < phases.length - 1 ? (
            <div className="mx-auto mt-8 hidden h-8 w-px bg-gold/35 lg:block" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}
