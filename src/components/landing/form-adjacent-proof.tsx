import { GOOGLE_REVIEWS, GOOGLE_RATING } from "@/lib/reviews";
import { Star } from "lucide-react";

/** Social proof placed directly above the form — highest conversion impact per CRO research */
export function FormAdjacentProof() {
  const review =
    GOOGLE_REVIEWS.find((r) => r.id === "mojo-vt") ?? GOOGLE_REVIEWS[0];

  return (
    <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3.5 lg:hidden">
      <div className="mb-1.5 flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-gold-ink text-gold-ink" />
        ))}
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-gold-ink">
          Google · {GOOGLE_RATING.score}/5
        </span>
      </div>
      <p className="text-xs italic leading-relaxed text-slate-200">
        &ldquo;{review.text.length > 90 ? `${review.text.slice(0, 90)}…` : review.text}&rdquo;
      </p>
      <p className="mt-1 text-[10px] text-gold-ink">— {review.name}</p>
    </div>
  );
}
