import { HighlightList } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_PRIVACY } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildNeuronourishMetadata("privacy");
}

export default function PrivacyPage() {
  return (
    <NeuroNourishShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-deep-slate">{NN_PRIVACY.title}</h1>
        <p className="mt-3 text-sm text-ink/60">Last updated: {NN_PRIVACY.lastUpdated}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink/80">
          {NN_PRIVACY.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg text-deep-slate">{section.heading}</h2>
              {"body" in section && section.body ? (
                <p className="mt-3">{section.body}</p>
              ) : null}
              {"highlights" in section && section.highlights ? (
                <div className="mt-3">
                  <HighlightList items={section.highlights} />
                </div>
              ) : null}
            </section>
          ))}
          <p>
            Contact:{" "}
            <a className="text-slate-blue underline" href={`mailto:${NN_PRIVACY.contactEmail}`}>
              {NN_PRIVACY.contactEmail}
            </a>
          </p>
        </div>
        <GoldButton href="/" className="mt-10">
          Back to homepage
        </GoldButton>
      </div>
    </NeuroNourishShell>
  );
}
