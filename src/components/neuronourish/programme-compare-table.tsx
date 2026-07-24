import { NN_PROGRAMME } from "@/lib/neuronourish-copy";

function Cell({ included }: { included: boolean }) {
  return (
    <td className="px-3 py-3 text-center text-sm">
      {included ? (
        <span className="font-medium text-gold" aria-label="Included">
          ✓
        </span>
      ) : (
        <span className="text-ink/35" aria-label="Not included">
          —
        </span>
      )}
    </td>
  );
}

/** Emer Version 2 — table of what is / is not included per tier. */
export function ProgrammeCompareTable() {
  return (
    <section className="mt-16" aria-labelledby="programme-compare">
      <h2
        id="programme-compare"
        className="text-center font-display text-2xl text-slate-blue sm:text-3xl"
      >
        {NN_PROGRAMME.compareTitle}
      </h2>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-mist/80 bg-white">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-mist/80 bg-linen/40">
              <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-blue">
                Included
              </th>
              {NN_PROGRAMME.compareTiers.map((tier) => (
                <th
                  key={tier}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-blue"
                >
                  {tier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NN_PROGRAMME.compareRows.map((row) => (
              <tr key={row.feature} className="border-b border-mist/60 last:border-b-0">
                <th scope="row" className="px-4 py-3 text-sm font-medium text-ink/85">
                  {row.feature}
                </th>
                <Cell included={row.highTouch} />
                <Cell included={row.guided} />
                <Cell included={row.selfLed} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
