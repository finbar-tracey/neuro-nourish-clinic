import { SectionEyebrow } from "@/components/neuronourish/shell";

type Align = "left" | "center";

export function SectionHeader({
  eyebrow,
  headline,
  subtext,
  align = "left",
  headlineClassName = "",
  as = "h2",
}: {
  eyebrow: string;
  headline: string;
  subtext?: string;
  align?: Align;
  headlineClassName?: string;
  /** Use h1 once per page for the primary page title (Screaming Frog: Missing H1). */
  as?: "h1" | "h2";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  const HeadlineTag = as;

  return (
    <div className={alignClass}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <HeadlineTag
        className={`nn-display-section mt-3 text-deep-slate ${headlineClassName} ${align === "center" ? "mx-auto" : "max-w-2xl"}`}
      >
        {headline}
      </HeadlineTag>
      {subtext ? (
        <p
          className={`nn-body mt-4 text-ink/85 ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  headline,
  subtext,
  as = "h1",
}: {
  eyebrow: string;
  headline: string;
  subtext?: string;
  /** Secondary page sections should use h2 to avoid Multiple H1. */
  as?: "h1" | "h2";
}) {
  const HeadlineTag = as;
  return (
    <header>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <HeadlineTag className="nn-display-section mt-3 text-deep-slate">{headline}</HeadlineTag>
      {subtext ? <p className="nn-body mt-4 text-ink/85">{subtext}</p> : null}
    </header>
  );
}
