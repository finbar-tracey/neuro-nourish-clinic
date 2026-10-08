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

      <ol className="relative mx-auto mt-12 max-w-3xl">
        <div
          className="absolute bottom-6 left-[1.2rem] top-6 w-[3px] rounded-full bg-gradient-to-b from-gold via-[color-mix(in_oklab,var(--brand-deep-slate)_55%,var(--brand-plum))] to-mist"
          aria-hidden
        />
        {NN_PROGRAMME.yearPhases.map((phase, index) => (
          <li key={phase.timing} className="relative flex gap-5 pb-10 last:pb-0 sm:gap-6">
            <span className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-white font-display text-sm text-deep-slate shadow-[0_6px_16px_rgba(27,58,92,0.12)]">
              {index + 1}
            </span>
            <div className="nn-card min-w-0 flex-1 rounded-2xl border border-mist/90 bg-white p-5 sm:p-6">
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
