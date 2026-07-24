import Image from "next/image";
import { SectionEyebrow } from "@/components/neuronourish/shell";
import { PageContainer } from "@/components/neuronourish/content/container";

export type LogoMarqueeItem = {
  name: string;
  logo: string;
  width: number;
  height: number;
  href?: string;
};

function LogoMark({ item }: { item: LogoMarqueeItem }) {
  const img = (
    <Image
      src={item.logo}
      alt=""
      width={item.width}
      height={item.height}
      className="nn-partner-logo h-12 w-auto max-w-[11rem] object-contain opacity-95 sm:h-14 sm:max-w-[13rem]"
    />
  );

  const inner = (
    <span className="nn-logo-marquee-item inline-flex h-16 shrink-0 items-center justify-center px-6 sm:h-[4.5rem] sm:px-8">
      {img}
      <span className="sr-only">{item.name}</span>
    </span>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="nn-partner-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label={`Visit ${item.name} (opens in new tab)`}
      >
        {inner}
      </a>
    );
  }

  return inner;
}

/** Full-bleed slow logo band — larger marks, no card chrome, calm loop. */
export function LogoMarquee({
  items,
  eyebrow,
  headline,
  footnote,
  className = "",
}: {
  items: readonly LogoMarqueeItem[];
  eyebrow?: string;
  headline?: string;
  footnote?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <section
      className={`nn-logo-marquee nn-partners-section overflow-hidden border-y border-linen/50 bg-linen/40 text-deep-slate ${className}`}
      aria-label={headline ?? eyebrow ?? "Partner logos"}
    >
      {(eyebrow || headline) && (
        <PageContainer width="xl" className="px-4 pt-8 text-center sm:px-6 sm:pt-9">
          {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
          {headline ? (
            <h2 className="mt-2 font-display text-xl text-slate-blue sm:text-2xl">{headline}</h2>
          ) : null}
        </PageContainer>
      )}

      <div className="nn-logo-marquee-viewport relative mt-6 pb-8 sm:mt-7 sm:pb-9">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[color-mix(in_oklab,var(--brand-linen)_40%,var(--brand-ivory))] to-transparent sm:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[color-mix(in_oklab,var(--brand-linen)_40%,var(--brand-ivory))] to-transparent sm:w-16"
          aria-hidden
        />

        <div className="nn-logo-marquee-track flex w-max items-center">
          {loop.map((item, index) => (
            <LogoMark key={`${item.name}-${index}`} item={item} />
          ))}
        </div>

        <ul className="nn-logo-marquee-static mx-auto hidden max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4">
          {items.map((item) => (
            <li key={item.name}>
              <LogoMark item={item} />
            </li>
          ))}
        </ul>
      </div>

      {footnote ? (
        <PageContainer width="xl" className="px-4 pb-8 text-center sm:px-6 sm:pb-9">
          <p className="mx-auto max-w-xl text-xs leading-relaxed text-ink/55">{footnote}</p>
        </PageContainer>
      ) : null}
    </section>
  );
}
