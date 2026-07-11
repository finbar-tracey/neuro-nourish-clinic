import Image from "next/image";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { PhoneLink } from "@/components/landing/phone-link";
import { BLB_DANIEL_SECTION, BLB_DIRECT_LENDER_SECTION } from "@/lib/meta-lp-copy";
import { MapPin, ShieldCheck } from "lucide-react";

type Props = {
  variant?: "hero" | "section" | "compact";
};

export function DanielExpertCard({ variant = "hero" }: Props) {
  const copy = BLB_DANIEL_SECTION;
  const direct = BLB_DIRECT_LENDER_SECTION;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <Image
          src="/daniel-mehrnia.webp"
          alt="Daniel Mehrnia — Bridging Loans Specialist"
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/40"
        />
        <div>
          <p className="text-sm font-semibold text-white">Daniel Mehrnia</p>
          <p className="text-xs text-slate-400">{copy.heroRole}</p>
        </div>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <section className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-16">
          <div className="relative mx-auto max-w-sm md:sticky md:top-24">
            <div className="absolute -inset-4 rounded-2xl bg-gold/10" />
            <Image
              src="/daniel-mehrnia.webp"
              alt="Daniel Mehrnia — Partner & Bridging Loans Specialist"
              width={640}
              height={853}
              className="relative rounded-2xl object-cover shadow-xl"
              priority
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-ink">
              {copy.eyebrow}
            </p>
            <h2 className="font-display mb-4 text-2xl font-medium capitalize text-navy md:text-3xl">
              {copy.title}
            </h2>
            <p className="mb-2 font-semibold text-navy">{copy.role}</p>
            <div className="mb-8 space-y-3 text-base leading-relaxed text-slate-600">
              {copy.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="mb-8 space-y-3 text-sm text-slate-700">
              {copy.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mb-8">
              <GoogleRatingBadge variant="compact" />
            </div>
            <div className="mb-8 flex flex-wrap gap-3">
              <a
                href="#quote-form"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy hover:bg-gold-light"
              >
                Start Free Enquiry
              </a>
              <PhoneLink
                contentName="LP Daniel Section Phone"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-navy hover:bg-slate-50"
              >
                020 7177 4141
              </PhoneLink>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <PhoneLink
                contentName="LP Daniel Section Phone Inline"
                className="inline-flex items-center gap-2 font-semibold text-navy hover:text-gold-ink"
              >
                020 7177 4141
              </PhoneLink>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4" />
                12 Old Bond Street, Mayfair
              </span>
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-brand-cream/50 p-6">
              <h3 className="font-display mb-4 text-lg font-medium text-navy">{direct.title}</h3>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                {direct.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <Image
        src="/daniel-mehrnia.webp"
        alt="Daniel Mehrnia"
        width={80}
        height={80}
        className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-gold/50"
      />
      <div>
        <p className="text-base font-semibold text-white">Daniel Mehrnia</p>
        <p className="text-sm text-gold">{copy.heroRole}</p>
        <p className="mt-1 text-xs text-slate-400">{copy.heroTagline}</p>
      </div>
    </div>
  );
}

export function TrustBadges() {
  const badges = [
    { label: "15+ Years", sub: "Experience" },
    { label: "£500M+", sub: "Finance arranged" },
    { label: "200+", sub: "Lenders" },
    { label: "10+", sub: "Countries served" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map(({ label, sub }) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center shadow-sm"
        >
          <p className="font-display text-lg font-medium text-navy">{label}</p>
          <p className="text-[11px] text-slate-600">{sub}</p>
        </div>
      ))}
    </div>
  );
}
