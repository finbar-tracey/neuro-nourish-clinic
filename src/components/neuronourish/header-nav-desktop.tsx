import Link from "next/link";
import { NN_NAV } from "@/lib/neuronourish-copy";

/** Server-rendered desktop nav — quiz is the only permanent gold CTA. */
export function NeuroNourishHeaderNavDesktop() {
  return (
    <div className="hidden items-center gap-4 lg:flex lg:gap-6">
      <nav className="flex items-center gap-5 text-[13px] text-sky-blue xl:gap-6" aria-label="Primary">
        {NN_NAV.links.map((l) => (
          <Link key={l.href} href={l.href} className="transition hover:text-ivory">
            {l.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/quiz"
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-4 py-2 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90"
      >
        {NN_NAV.ctaQuiz}
      </Link>
    </div>
  );
}
