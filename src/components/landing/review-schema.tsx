import { GOOGLE_REVIEWS } from "@/lib/reviews";

export function ReviewSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bridging Loans Broker",
    review: GOOGLE_REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: parseReviewDate(r.date),
      reviewBody: r.text,
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function parseReviewDate(display: string): string {
  const parsed = Date.parse(display.replace(/(\d+) (\w+) (\d+)/, "$2 $1, $3"));
  if (Number.isNaN(parsed)) return "2026-01-01";
  return new Date(parsed).toISOString().slice(0, 10);
}
