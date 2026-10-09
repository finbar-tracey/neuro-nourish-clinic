import Link from "next/link";
import { NN_NAV } from "@/lib/neuronourish-copy";

/** Server-rendered desktop nav — avoids client/server hydration drift on static links. */
export function NeuroNourishHeaderNavDesktop() {
  return (
    <div className="hidden items-center gap-4 lg:flex lg:gap-6">
      <nav className="flex items-center gap-6 text-[13px] text-sky-blue" aria-label="Primary">
        {NN_NAV.links.map((l) => (
          <Link key={l.href} href={l.href} className="transition hover:text-ivory">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/discovery"
          className="inline-flex min-h-[44px] items-center rounded-full border border-ivory/25 px-4 py-2 text-[13px] font-medium text-ivory transition hover:bg-white/10"
        >
          {NN_NAV.ctaDiscovery}
        </Link>
        <Link
          href="/quiz"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-4 py-2 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90"
        >
          {NN_NAV.ctaQuiz}
        </Link>
      </div>
    </div>
  );
}
