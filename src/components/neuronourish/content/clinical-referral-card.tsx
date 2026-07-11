import { NeuroNourishMark } from "@/components/brand/neuronourish-mark";
import { NN_CLINICAL_REFERRAL_CARD } from "@/lib/neuronourish-copy";
import { getSiteUrl } from "@/lib/site-url";

function ReferralCardFace({
  side,
  siteUrl,
}: {
  side: "front" | "back";
  siteUrl: string;
}) {
  const card = NN_CLINICAL_REFERRAL_CARD;
  const isFront = side === "front";

  return (
    <article
      className={`nn-referral-card-face relative flex min-h-[210mm] w-[99mm] flex-col border-2 border-gold/40 bg-[#faf8f4] p-5 text-[9.5pt] leading-snug text-deep-slate shadow-sm print:shadow-none ${
        isFront ? "nn-referral-card-front" : "nn-referral-card-back"
      }`}
    >
      <div className="absolute inset-x-5 top-0 h-0.5 bg-gold/70" aria-hidden />

      {isFront ? (
        <>
          <div className="mt-2">
            <NeuroNourishMark theme="dark" variant="footer" className="max-w-[8.5rem]" />
          </div>

          <p className="mt-4 text-[8pt] font-semibold uppercase tracking-[0.14em] text-slate-blue">
            {card.front.kicker}
          </p>

          <p className="mt-3 text-[9pt] leading-relaxed text-ink/80">{card.front.audience}</p>

          <hr className="my-4 border-gold/25" />

          <h2 className="text-[9pt] font-bold uppercase tracking-wide text-deep-slate">
            {card.front.referTitle}
          </h2>

          <ol className="mt-3 space-y-3">
            {card.front.steps.map((step, index) => (
              <li key={step.title}>
                <p className="font-bold text-deep-slate">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-[8.5pt] leading-relaxed text-ink/75">
                  {step.body}
                  {index === 0 ? (
                    <>
                      {" "}
                      <span className="font-medium text-slate-blue">{siteUrl}</span>
                    </>
                  ) : null}
                  {index === 1 ? (
                    <>
                      {" "}
                      <span className="font-medium text-slate-blue">{card.front.referralEmail}</span>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>

          <hr className="my-4 border-gold/25" />

          <h3 className="text-[9pt] font-bold uppercase tracking-wide text-deep-slate">
            {card.front.manageTitle}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {card.front.manageItems.map((item) => (
              <li key={item} className="flex gap-2 text-[8.5pt] leading-relaxed text-ink/75">
                <span className="text-gold" aria-hidden>
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-[10pt] font-bold uppercase tracking-wide text-deep-slate">
            {card.back.headline}
          </h2>
          <p className="mt-3 text-[8.5pt] leading-relaxed text-ink/75">{card.back.intro}</p>

          <hr className="my-4 border-gold/25" />

          <h3 className="text-[9pt] font-bold uppercase tracking-wide text-deep-slate">
            {card.back.guaranteeTitle}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {card.back.guarantees.map((item) => (
              <li key={item.title} className="rounded border border-gold/20 bg-white/60 p-2.5">
                <p className="text-[8.5pt] font-bold text-deep-slate">{item.title}</p>
                <p className="mt-1 text-[8pt] leading-relaxed text-ink/75">{item.body}</p>
              </li>
            ))}
          </ul>

          <hr className="my-4 border-gold/25" />

          <div className="mt-auto rounded border border-gold/25 bg-white/70 p-3">
            <p className="text-[9pt] font-bold uppercase tracking-wide text-deep-slate">
              {card.back.contactTitle}
            </p>
            <p className="mt-2 text-[8.5pt] text-ink/80">
              Phone: {card.back.phone}
              <br />
              {card.back.location}
              <br />
              {card.back.portalLabel}:{" "}
              <span className="font-medium text-slate-blue">{siteUrl}/clinics</span>
            </p>
          </div>
        </>
      )}
    </article>
  );
}

export function ClinicalReferralCardPreview() {
  const siteUrl = getSiteUrl();

  return (
    <div className="nn-referral-card-preview">
      <div className="mb-6 rounded-xl border border-mist bg-white/80 p-4 text-sm text-ink/70">
        <p className="font-medium text-slate-blue">Print specification</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>{NN_CLINICAL_REFERRAL_CARD.spec.dimensions}</li>
          <li>{NN_CLINICAL_REFERRAL_CARD.spec.stock}</li>
          <li>{NN_CLINICAL_REFERRAL_CARD.spec.finish}</li>
        </ul>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        <ReferralCardFace side="front" siteUrl={siteUrl} />
        <ReferralCardFace side="back" siteUrl={siteUrl} />
      </div>
    </div>
  );
}
