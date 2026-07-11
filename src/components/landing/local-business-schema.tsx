import { GOOGLE_RATING } from "@/lib/reviews";

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "Bridging Loans Broker",
    description:
      "Independent bridging loan specialists arranging short-term property finance for investors and developers across the UK.",
    url: "https://bridgingloansbroker.co.uk",
    telephone: "+442071774141",
    email: "daniel@bridgingloansbroker.co.uk",
    address: {
      "@type": "PostalAddress",
      streetAddress: "12 Old Bond Street",
      addressLocality: "London",
      addressRegion: "Mayfair",
      addressCountry: "GB",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: GOOGLE_RATING.score,
      reviewCount: GOOGLE_RATING.count,
      bestRating: 5,
    },
    areaServed: "GB",
    priceRange: "£££",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
