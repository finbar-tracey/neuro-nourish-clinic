import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("employers");

/** Priority 8 stub — full employer offering page follows. */
export default function EmployersPage() {
  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="md" className="text-center">
          <SectionHeader
            eyebrow="For employers"
            headline="Better Brain Health at Work"
            subtext="NeuroNourish delivers practical brain-health education and preventative cognitive-health programmes for organisations."
            align="center"
            headlineClassName="max-w-2xl"
            as="h1"
          />
          <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm text-ink/75">
            {[
              "Corporate Masterclasses",
              "Brain Health Assessments",
              "Employee Brain Health Programmes",
              "Executive / Leadership Programmes",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-mist/80 bg-white px-4 py-3 shadow-sm">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <GoldButton href="/contact">Bring NeuroNourish to Your Organisation</GoldButton>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
