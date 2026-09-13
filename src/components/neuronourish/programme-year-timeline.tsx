import { NN_PROGRAMME } from "@/lib/neuronourish-copy";

/** Connected year timeline — Months 1–3 / 4–9 / 10–12 as one sequence. */
export function ProgrammeYearTimeline() {
  return (
    <section className="mt-16" aria-labelledby="programme-year">
      <h2
        id="programme-year"
        className="text-center font-display text-2xl text-deep-slate sm:text-3xl"
      >
        {NN_PROGRAMME.yearTitle}
      </h2>

      <ol className="relative mx-auto mt-10 max-w-2xl">
        <div
          className="absolute bottom-4 left-[1.15rem] top-4 w-px bg-gradient-to-b from-gold via-mist to-linen"
          aria-hidden
        />
        {NN_PROGRAMME.yearPhases.map((phase, index) => (
          <li key={phase.timing} className="relative flex gap-5 pb-8 last:pb-0">
            <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-white font-display text-sm text-deep-slate shadow-sm">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border border-mist/90 bg-white p-5 shadow-[0_8px_24px_rgba(26,51,72,0.06)] sm:p-6">
              <p className="nn-eyebrow text-gold">{phase.timing}</p>
              <h3 className="nn-display-card mt-2 text-deep-slate">{phase.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{phase.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
