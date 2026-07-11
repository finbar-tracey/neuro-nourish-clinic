import Image from "next/image";
import Link from "next/link";
import { GOOGLE_RATING, GOOGLE_REVIEWS } from "@/lib/reviews";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { Section, SectionCta } from "@/components/landing/layout";
import { StarRating } from "@/components/ui/star-rating";
import { ExternalLink } from "lucide-react";

const OUTCOMES = [
  { reviewId: "mojo-vt", stat: "48 hrs", label: "Loan secured" },
  { reviewId: "zara-miami", stat: "4 days", label: "Care home funded" },
  { reviewId: "salima-yasmin", stat: "3rd broker", label: "HMO deal saved" },
];

export function GoogleReviewsSection() {
  const featured = GOOGLE_REVIEWS.filter((r) => r.featured);
  const others = GOOGLE_REVIEWS.filter((r) => !r.featured);

  return (
    <Section id="reviews" className="bg-white">
      <div className="mb-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {OUTCOMES.map(({ reviewId, stat, label }) => (
          <div
            key={reviewId}
            className="rounded-2xl border border-gold/20 bg-brand-cream px-5 py-6 text-center"
          >
            <p className="font-display text-2xl font-medium text-gold-ink md:text-3xl">
              {stat}
            </p>
            <p className="mt-1 text-sm font-semibold text-navy">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-12 grid items-start gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
        <GoogleRatingBadge variant="card" />
        <div>
          <h2 className="font-display text-2xl font-medium capitalize text-navy md:text-3xl">
            What Our Clients Say on Google
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            All {GOOGLE_RATING.count} Google reviews — real outcomes from
            investors who needed speed and specialist lenders.{" "}
            <Link
              href="https://bridgingloansbroker.co.uk/reviews/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-gold-ink hover:underline"
            >
              View on site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        {featured.map((review) => (
          <ReviewCard key={review.id} review={review} featured />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {others.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <SectionCta
        label="Join Them — Get My Free Quote"
        note={`${GOOGLE_RATING.score}/5 · ${GOOGLE_RATING.count} Google reviews`}
        showPhone
      />

      <p className="mt-6 text-center text-xs text-slate-600">
        Source: Google · Reviews aren&apos;t verified by Google
      </p>
    </Section>
  );
}

function ReviewCard({
  review,
  featured = false,
}: {
  review: (typeof GOOGLE_REVIEWS)[number];
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-6 ${
        featured
          ? "border-gold/30 shadow-md ring-1 ring-gold/10"
          : "border-slate-200 shadow-sm"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.avatar ? (
            <Image
              src={review.avatar}
              alt={review.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
              {review.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-navy">{review.name}</p>
            <p className="text-xs text-slate-600">{review.date}</p>
          </div>
        </div>
        <GoogleMiniBadge />
      </div>
      <div className="mb-3">
        <StarRating size="sm" />
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        &ldquo;{review.text}&rdquo;
      </p>
    </article>
  );
}

function GoogleMiniBadge() {
  return (
    <span className="shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
      Google
    </span>
  );
}
