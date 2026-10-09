import Link from "next/link";
import { NeuroNourishMark } from "@/components/brand/neuronourish-mark";
import { CnsLiveOpsBanner } from "@/components/neuronourish/cns-live-ops-banner";
import { NeuroNourishHeader } from "@/components/neuronourish/header";
import { NN_COMPLIANCE, NN_FOOTER } from "@/lib/neuronourish-copy";

export { NeuroNourishHeader };

export function NeuroNourishFooter() {
  return (
    <footer className="nn-site-footer border-t border-ivory/10 bg-deep-slate px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 text-sky-blue sm:px-6 sm:pt-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <NeuroNourishMark theme="dark" variant="footer" className="max-w-[11rem]" />
          <p className="nn-footer-text mt-4 max-w-sm text-mist/90">{NN_FOOTER.tagline}</p>
          <p className="nn-footer-text mt-4 max-w-md text-sky-blue/90">{NN_COMPLIANCE}</p>
          <a
            href={`mailto:${NN_FOOTER.email}`}
            className="nn-text-link nn-footer-text mt-4 inline-block"
          >
            {NN_FOOTER.email}
          </a>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="nn-eyebrow text-gold">Consumers</p>
            <ul className="nn-footer-text mt-3 space-y-2.5">
              {NN_FOOTER.consumers.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sky-blue transition hover:text-ivory">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="nn-eyebrow text-gold">Organisations</p>
            <ul className="nn-footer-text mt-3 space-y-2.5">
              {NN_FOOTER.clinics.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sky-blue transition hover:text-ivory">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-ivory/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="nn-footer-text text-sky-blue/85">{NN_FOOTER.location}</p>
        <p className="nn-footer-text text-sky-blue/75">{NN_FOOTER.copyright}</p>
      </div>
    </footer>
  );
}

export function NeuroNourishShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-ivory text-ink">
      <CnsLiveOpsBanner />
      <NeuroNourishHeader />
      <main id="main-content" className="flex-1 scroll-mt-20">
        {children}
      </main>
      <NeuroNourishFooter />
    </div>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="nn-eyebrow text-gold">{children}</p>;
}

export function GoldButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`nn-gold-cta inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-6 py-3 text-[13px] font-medium text-deep-slate hover:bg-gold/90 ${className}`}
    >
      {children}
    </Link>
  );
}

export function OutlineButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-full border border-deep-slate/25 px-6 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-linen/40 ${className}`}
    >
      {children}
    </Link>
  );
}
