"use client";

import { BrandLogo } from "@/components/brand/logo";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { PhoneLink } from "@/components/landing/phone-link";
import { Phone } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
        <BrandLogo variant="compact" theme="dark" />
        <div className="hidden min-w-0 sm:block">
          <GoogleRatingBadge variant="compact" inverted href="#reviews" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PhoneLink
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 lg:hidden"
            aria-label="Call 020 7177 4141"
          >
            <Phone className="h-4 w-4 text-gold-light" />
          </PhoneLink>
          <PhoneLink className="hidden items-center gap-2 text-sm font-semibold text-white hover:text-gold lg:flex">
            <Phone className="h-4 w-4 text-gold-light" />
            020 7177 4141
          </PhoneLink>
          <a
            href="#quote-form"
            className="rounded-lg bg-gold px-3.5 py-2.5 text-xs font-semibold text-navy shadow-sm transition hover:bg-gold-light sm:px-5 sm:text-sm"
          >
            Get Free Quote
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 bg-navy-dark/95 px-4 py-2 sm:hidden">
        <GoogleRatingBadge variant="mobile" inverted href="#reviews" className="justify-center" />
      </div>
    </header>
  );
}
