import { SectionEyebrow } from "@/components/neuronourish/shell";

type Align = "left" | "center";

export function SectionHeader({
  eyebrow,
  headline,
  subtext,
  align = "left",
  headlineClassName = "",
}: {
  eyebrow: string;
  headline: string;
  subtext?: string;
  align?: Align;
  headlineClassName?: string;
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={alignClass}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2
        className={`nn-display-section mt-3 text-slate-blue ${headlineClassName} ${align === "center" ? "mx-auto" : "max-w-2xl"}`}
      >
        {headline}
      </h2>
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
}: {
  eyebrow: string;
  headline: string;
  subtext?: string;
}) {
  return (
    <header>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h1 className="nn-display-section mt-3 text-slate-blue">{headline}</h1>
      {subtext ? <p className="nn-body mt-4 text-ink/85">{subtext}</p> : null}
    </header>
  );
}
