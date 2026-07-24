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
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {NN_FOUNDER_TRUST.items.map((item) => (
          <div
            key={item.label}
            className={`nn-founder-trust-badge relative flex min-h-[6rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border px-3 py-4 text-center transition-colors ${
              light
                ? "border-mist/80 bg-white/70 hover:bg-white"
                : "border-ivory/15 bg-white/5 hover:bg-white/8"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/50" aria-hidden />
            <Image
              src={item.logo}
              alt={item.label}
              width={item.width}
              height={item.height}
              className="mx-auto h-8 w-auto max-w-[7.5rem] object-contain"
            />
            <p
              className={`flex min-h-[2.5rem] items-center justify-center text-[11px] leading-snug ${
                light ? "text-ink/65" : "text-lavender"
              }`}
            >
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
