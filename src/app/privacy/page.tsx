import Link from "next/link";
import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { HighlightList } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_PRIVACY } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";
import { buildPageMetadata } from "@/lib/seo";
import { brandName, isHealthcare, partnerDisplayName } from "@/lib/vertical-config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  if (isHealthcare()) {
    return buildPageMetadata({
      title: `Privacy Policy | ${brandName()}`,
      description:
        "How Booked Consult collects and uses your data when you enquire about a dental implant consultation.",
      path: "/privacy",
    });
  }
  return buildNeuronourishMetadata("privacy");
}

export default function PrivacyPage() {
  if (isHealthcare()) {
    return <HealthcarePrivacy />;
  }
  return <NeuronourishPrivacy />;
}

function NeuronourishPrivacy() {
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

function HealthcarePrivacy() {
  const clinic = partnerDisplayName();

  return (
    <div className="min-h-screen bg-white text-navy">
      <header className="border-b border-slate-200 bg-brand-cream px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <BookedConsultMark variant="compact" theme="light" href="/for-clinics" />
          <Link
            href="/lp/implants"
            className="text-sm font-semibold text-gold-ink hover:text-gold-dark"
          >
            Book consultation →
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-display text-3xl font-medium">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-600">Last updated: June 2026</p>

        <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-navy">Who we are</h2>
            <p>
              Booked Consult arranges dental implant consultation bookings on behalf of
              participating clinics including {clinic}. We do not provide clinical treatment.
              Contact:{" "}
              <a className="text-gold-ink hover:underline" href="mailto:hello@bookedconsult.com">
                hello@bookedconsult.com
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-navy">Data we collect</h2>
            <p>
              When you submit our enquiry form we collect your name, phone number, email address,
              postcode, treatment interest, timeline, and budget band. We may also receive campaign
              parameters (UTM tags or Facebook click IDs).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-navy">How we use your data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To contact you about booking a free implant consultation</li>
              <li>To qualify your enquiry against clinic criteria</li>
              <li>To share necessary details with {clinic} to arrange your appointment</li>
              <li>To measure advertising performance</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-navy">Sharing with the clinic</h2>
            <p>
              If you are qualified, we share your contact details and enquiry information with{" "}
              {clinic} so they can confirm and deliver your consultation. Clinical records are held
              by the clinic as data controller for treatment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Legal basis (UK GDPR)</h2>
            <p>
              We process your data based on your consent when you submit the form, and our legitimate
              interest in responding to enquiries and operating our business. You may withdraw consent
              at any time by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Cookies &amp; analytics</h2>
            <p>
              We use Meta (Facebook) Pixel to measure ad performance. This may set cookies or similar
              technologies in your browser. You can control cookies through your browser settings and
              Meta&apos;s ad preferences tools.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Sharing &amp; retention</h2>
            <p>
              We do not sell your personal data. We use service providers (hosting, email, SMS, CRM) who
              process data on our instructions. We retain enquiry data for as long as needed to manage
              your request and comply with law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy">Your rights</h2>
            <p>
              You have the right to access, correct, erase, restrict, or object to processing of your
              data, and to lodge a complaint with the ICO (ico.org.uk). Contact us to exercise these
              rights.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link href="/lp/implants" className="text-sm font-semibold text-gold-ink hover:text-gold-dark">
            ← Back to consultation form
          </Link>
        </p>
      </main>
    </div>
  );
}
