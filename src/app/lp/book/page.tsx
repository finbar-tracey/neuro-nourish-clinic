import { BookPageClient } from "@/components/landing/book-page-client";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = buildPageMetadata({
  title: "Book a Priority Call | Bridging Loans Broker",
  description: "Book a priority consultation with Daniel at Bridging Loans Broker.",
  path: "/lp/book",
});

export default function BookPage() {
  return (
    <Suspense>
      <BookPageClient />
    </Suspense>
  );
}
