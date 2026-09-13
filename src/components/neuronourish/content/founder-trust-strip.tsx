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
      <p className={`nn-eyebrow text-center ${light ? "text-gold" : "text-lavender"}`}>
        As supported by &amp; featured in
      </p>
      <ul className="mt-6 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
        {NN_FOUNDER_TRUST.items.map((item) => (
          <li
            key={item.label}
            className={`nn-founder-trust-badge relative flex min-h-[6.25rem] w-[calc(50%-0.4rem)] max-w-[12.5rem] flex-col items-center justify-center gap-2 overflow-hidden px-3 py-5 text-center transition-colors sm:w-[calc(33.333%-0.7rem)] lg:w-[calc(20%-0.8rem)] ${
              light
                ? "border border-transparent bg-transparent hover:bg-linen/30"
                : "rounded-xl border border-ivory/15 bg-white/95 hover:bg-white"
            }`}
          >
            {!light ? <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/50" aria-hidden /> : null}
            <Image
              src={item.logo}
              alt={item.label}
              width={item.width}
              height={item.height}
              className="mx-auto h-12 w-auto max-w-[10rem] object-contain opacity-80 sm:h-[3.25rem] [filter:grayscale(1)_brightness(0.45)_contrast(1.05)]"
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
