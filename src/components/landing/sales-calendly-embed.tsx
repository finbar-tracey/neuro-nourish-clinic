"use client";

import type { ReactNode } from "react";
import Script from "next/script";
import { Calendar, CheckCircle2, ExternalLink, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import {
  hasSalesCalendlyEmbed,
  salesBookingHref,
  salesCalendlyUrl,
  salesContactEmailDisplay,
} from "@/lib/for-clinics-config";
import { HEALTHCARE_FOR_CLINICS } from "@/lib/healthcare-lp-copy";
import { trackMetaEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";

function embedUrl(url: string) {
  if (!url || url.startsWith("#")) return null;
  if (url.includes("/embed/")) return url;
  return url.replace("calendly.com/", "calendly.com/embed/");
}

type SalesCalendlyEmbedProps = {
  className?: string;
  compact?: boolean;
};

function SalesBookingFallback({ className }: { className?: string }) {
  const copy = HEALTHCARE_FOR_CLINICS;
  const email = salesContactEmailDisplay();
  const mailto = salesBookingHref();

  return (
    <div
      id="calendly-booking"
      className={cn(
        "scroll-mt-24 flex min-h-[420px] flex-col rounded-2xl border border-white/15 bg-white p-6 shadow-2xl sm:min-h-[480px] sm:p-7",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/20">
          <Calendar className="h-6 w-6 text-gold-ink" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-xl font-medium text-navy">{copy.cta}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.ctaNote}</p>
        </div>
      </div>

      <ul className="mb-6 space-y-3 border-y border-slate-100 py-5">
        {copy.bookingFallbackBullets.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3">
        <a
          href={mailto}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-md transition hover:bg-gold-light"
          onClick={() => trackMetaEvent("Schedule", { content_name: "B2B Pilot Call Email" })}
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          Email to schedule
        </a>
        <p className="text-center text-xs text-slate-500">
          {email} · {copy.bookingFallbackNote}
        </p>
      </div>
    </div>
  );
}

export function SalesCalendlyEmbed({ className, compact }: SalesCalendlyEmbedProps) {
  const url = salesCalendlyUrl();
  const embed = embedUrl(url);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked || !hasSalesCalendlyEmbed()) return;
    trackMetaEvent("Schedule", { content_name: "B2B Pilot Call" });
  }, [tracked]);

  if (!hasSalesCalendlyEmbed()) {
    return <SalesBookingFallback className={className} />;
  }

  return (
    <div
      id="calendly-booking"
      className={cn(
        "scroll-mt-24 rounded-2xl border border-white/15 bg-white p-4 shadow-2xl sm:p-5",
        className,
      )}
    >
      {!compact && (
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20">
            <Calendar className="h-5 w-5 text-gold-ink" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-lg font-medium text-navy">{HEALTHCARE_FOR_CLINICS.cta}</h2>
            <p className="mt-0.5 text-sm text-slate-600">{HEALTHCARE_FOR_CLINICS.ctaNote}</p>
          </div>
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setTracked(true)}
        className="mb-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-md transition hover:bg-gold-light md:hidden"
      >
        {HEALTHCARE_FOR_CLINICS.cta}
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      </a>

      {embed && (
        <>
          <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
          <div
            className={cn(
              "calendly-inline-widget min-h-[520px] overflow-hidden rounded-xl border border-slate-200 md:min-h-[580px]",
              compact && "min-h-[480px]",
            )}
            data-url={`${embed}${embed.includes("?") ? "&" : "?"}hide_gdpr_banner=1`}
          />
        </>
      )}
    </div>
  );
}

export function SalesCalendlyLink({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const href = salesBookingHref();
  const isMailto = href.startsWith("mailto:");

  return (
    <a
      href={href}
      className={className}
      {...(!isMailto ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() =>
        trackMetaEvent("Schedule", {
          content_name: isMailto ? "B2B Pilot Call Email" : "B2B Pilot Call",
        })
      }
    >
      {children ?? HEALTHCARE_FOR_CLINICS.cta}
    </a>
  );
}
