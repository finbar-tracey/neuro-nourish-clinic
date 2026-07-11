const LENDER_TYPES = [
  "Specialist bridging lenders",
  "Private & family office finance",
  "Commercial property lenders",
  "Auction finance providers",
  "Development & refurb lenders",
  "International investor finance",
];

export function LenderNetworkSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
          Lender Network
        </p>
        <h2 className="font-display mb-3 text-2xl font-medium capitalize text-navy md:text-3xl">
          Access to 200+ Lenders
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-slate-600">
          200+ lenders — access to the best rates and deals for your specific scenario. Not one
          bank&apos;s product range.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {LENDER_TYPES.map((type) => (
            <span
              key={type}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-navy shadow-sm"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
