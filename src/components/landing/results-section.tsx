import { GOOGLE_REVIEWS } from "@/lib/reviews";

const OUTCOMES = [
  {
    reviewId: "mojo-vt",
    outcome: "48 hours",
    label: "Bridging loan secured",
    context: "New investment project funded",
  },
  {
    reviewId: "zara-miami",
    outcome: "4 days",
    label: "Care home refurb funded",
    context: "Tenants protected, deal saved",
  },
  {
    reviewId: "salima-yasmin",
    outcome: "2 brokers failed",
    label: "Large HMO development",
    context: "Daniel got the valuation through",
  },
];

export function ResultsSection() {
  const cases = OUTCOMES.map((item) => {
    const review = GOOGLE_REVIEWS.find((r) => r.id === item.reviewId)!;
    return { ...item, review };
  });

  return (
    <section className="bg-navy py-14 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
            Real Results
          </p>
          <h2 className="font-display mb-3 text-3xl font-medium capitalize">
            Named Outcomes, Not Vague Promises
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Specific results from real clients — the kind of social proof that
            moves investors from browsing to enquiring.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cases.map(({ outcome, label, context, review }) => (
            <article
              key={review.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <p className="font-display mb-1 text-4xl font-medium text-gold">
                {outcome}
              </p>
              <p className="mb-4 text-sm font-semibold text-white">{label}</p>
              <p className="mb-4 text-xs text-slate-400">{context}</p>
              <blockquote className="border-t border-white/10 pt-4">
                <p className="text-sm italic leading-relaxed text-slate-300">
                  &ldquo;{review.text}&rdquo;
                </p>
                <footer className="mt-2 text-xs text-gold">
                  — {review.name}, Google
                </footer>
              </blockquote>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="#quote-form"
            className="inline-flex rounded-md border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Get the Same Service — Free Quote
          </a>
        </div>
      </div>
    </section>
  );
}
