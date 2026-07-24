import Image from "next/image";
import { NN_FOUNDER_TRUST } from "@/lib/neuronourish-copy";

export function FounderTrustStrip({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";

  return (
    <div className={`mt-14 border-t ${light ? "border-mist/80" : "border-ivory/15"} pt-10 sm:mt-16 ${className}`}>
      <p className={`nn-eyebrow text-center ${light ? "text-slate-blue" : "text-lavender"}`}>
        As supported by &amp; featured in
      </p>
      <ul className="mt-6 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
        {NN_FOUNDER_TRUST.items.map((item) => (
          <li
            key={item.label}
            className={`nn-founder-trust-badge relative flex min-h-[5.5rem] w-[calc(50%-0.4rem)] max-w-[11rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border px-3 py-4 text-center transition-colors sm:w-[calc(33.333%-0.7rem)] lg:w-[calc(20%-0.8rem)] ${
              light
                ? "border-mist/80 bg-white hover:bg-linen/40"
                : "border-ivory/15 bg-white/95 hover:bg-white"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/50" aria-hidden />
            <Image
              src={item.logo}
              alt={item.label}
              width={item.width}
              height={item.height}
              className="mx-auto h-10 w-auto max-w-[8.5rem] object-contain"
            />
            {item.detail ? (
              <p className="text-[11px] leading-snug text-ink/60">{item.detail}</p>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
