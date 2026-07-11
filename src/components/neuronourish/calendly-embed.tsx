"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { NN_DISCOVERY } from "@/lib/neuronourish-copy";

function buildCalendlyEmbedUrl(url: string, leadId?: string, utmSource?: string): string {
  const embed = url.includes("/embed/") ? url : url.replace("calendly.com/", "calendly.com/embed/");
  if (!leadId) return embed;

  try {
    const attributed = new URL(embed);
    attributed.searchParams.set("utm_source", utmSource ?? "crm_recovery");
    attributed.searchParams.set("a1", leadId);
    return attributed.toString();
  } catch {
    return embed;
  }
}

export function DiscoveryCalendlyEmbed({
  url,
  leadId,
  utmSource,
}: {
  url: string;
  leadId?: string;
  utmSource?: string;
}) {
  const [active, setActive] = useState(false);
  const embed = useMemo(
    () => buildCalendlyEmbedUrl(url, leadId, utmSource),
    [url, leadId, utmSource],
  );

  if (!active) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-linen bg-white p-8 text-center">
        <p className="max-w-md text-sm leading-relaxed text-ink/70">
          {NN_DISCOVERY.calendlyPrompt}
        </p>
        <button
          type="button"
          onClick={() => setActive(true)}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-8 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90"
        >
          {NN_DISCOVERY.calendlyButton}
        </button>
      </div>
    );
  }

  return (
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      <div
        className="calendly-inline-widget min-h-[650px] w-full"
        data-url={embed}
      />
    </>
  );
}
