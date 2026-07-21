import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildPageMetadata } from "@/lib/seo";

const TEAM = [
  {
    name: "Emer Sexton",
    role: "Founder · Nutrition Scientist · Ireland's First ReCODE Practitioner",
    bio: "Leads clinical direction and Premium programme walkthroughs. Lived experience of cognitive recovery after a cycling accident shaped NeuroNourish.",
  },
  {
    name: "CORU-registered dietitians",
    role: "Clinical nutrition oversight",
    bio: "Programme nutrition protocols are developed and supervised with CORU-registered dietitian collaboration.",
  },
  {
    name: "Care & coaching team",
    role: "Accountability and day-to-day support",
    bio: "One-to-one coaching, check-ins, and app-guided habit support between clinical touchpoints.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "Medical & Care Team | NeuroNourish",
  description:
    "Meet the NeuroNourish clinical and care team — founder-led brain health programmes with dietitian oversight and coaching support.",
  path: "/team",
});

export default function TeamPage() {
  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="lg">
          <SectionHeader
            eyebrow="Team"
            headline="Medical & care team"
            subtext="Clinical oversight, nutrition expertise, and coaching — built around long-term brain health."
            align="center"
            headlineClassName="max-w-2xl"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="relative overflow-hidden rounded-2xl border border-mist bg-white/90 p-6 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/55" aria-hidden />
                <h2 className="nn-display-card text-slate-blue">{member.name}</h2>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gold">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">{member.bio}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <GoldButton href="/about">Read Emer&apos;s full story</GoldButton>
            <Link href="/discovery" className="nn-text-link text-sm">
              Book a discovery call →
            </Link>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
