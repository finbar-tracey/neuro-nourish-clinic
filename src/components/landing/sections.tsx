import {
  Building2,
  Clock,
  Globe,
  Hammer,
  Landmark,
  TrendingUp,
} from "lucide-react";

const services = [
  {
    icon: TrendingUp,
    title: "Investment Bridging Loans",
    description:
      "We'll help you secure funds for your next investment purchase or refinance.",
  },
  {
    icon: Building2,
    title: "Commercial Bridging Loans",
    description: "Our brokers source tailored short-term finance to fit your goals.",
  },
  {
    icon: Landmark,
    title: "Auction Bridging Finance",
    description:
      "Get quick, pre-approved funding so you can complete your purchase on time.",
  },
  {
    icon: Hammer,
    title: "Development Bridging Finance",
    description: "We'll arrange flexible finance to keep your project moving.",
  },
  {
    icon: Globe,
    title: "International Bridging Loans",
    description:
      "Access global lending solutions with expert support every step of the way.",
  },
  {
    icon: Clock,
    title: "Large Bridging Loans",
    description:
      "Our team specialises in arranging multi-million-pound bridging loans fast.",
  },
];

const stats = [
  { value: "15+", label: "Years' Experience in property and finance" },
  { value: "£500M+", label: "Bridging Finance Arranged" },
  { value: "200+", label: "Trusted Lenders" },
  { value: "10+", label: "Countries Served" },
];

const bridgingUseCases = [
  "HMO",
  "Buying a new property before your current sale completes",
  "Auction purchases requiring fast completion",
  "Funding property refurbishments or conversions",
  "Short-term cash-flow needs for developers or investors",
  "Releasing equity tied up in assets",
];

const insights = [
  {
    featured: true,
    date: "Jun 12, 2026",
    readTime: "14 min",
    title: "Limited Company Bridging Loan",
    excerpt:
      "A limited company bridging loan funds SPV and Ltd Co property purchases in 7 to 14 days. Rates, LTV, personal guarantees and the full application process explained for 2026.",
    author: "Daniel Mehrnia",
  },
  {
    featured: false,
    date: "Jun 10, 2026",
    readTime: "13 min",
    title: "Bridging Loans for Refurbishment",
    excerpt:
      "A bridging loan for refurbishment funds the properties mortgage lenders reject. Light works from 0.60%/month. Heavy structural works with staged drawdowns.",
    author: "Daniel Mehrnia",
  },
  {
    featured: false,
    date: "Jun 9, 2026",
    readTime: "11 min",
    title: "HMO Bridging Finance: Rates, LTV and How It Works",
    excerpt:
      "HMO bridging finance funds the acquisition, conversion and licensing of houses in multiple occupation. Rates from 0.85%/month, LTV to 75%.",
    author: "Daniel Mehrnia",
  },
];

const faqs = [
  {
    q: "What is a bridging loan?",
    a: "A bridging loan is a short-term property loan used to cover a funding gap between buying and selling or completing an urgent transaction.",
  },
  {
    q: "How quickly can I get a bridging loan?",
    a: "Funding can be arranged within 3–10 working days, depending on your documentation and the lender.",
  },
  {
    q: "What's the maximum LTV for bridging finance?",
    a: "Up to 75% on residential property and 70% on commercial property, subject to valuation.",
  },
  {
    q: "Are bridging loans regulated?",
    a: "Unregulated for investment or business purposes.",
  },
  {
    q: "Do you help with international or expat investors?",
    a: "Yes, we help our international clients purchase a UK property including investors and property refurbishment.",
  },
  {
    q: "How long can I borrow for?",
    a: "Typically between 3 and 36 months, depending on your exit strategy and lender terms.",
  },
  {
    q: "Do you work with developers and investors?",
    a: "Yes — we regularly help developers, investors, and landlords fund projects and purchases quickly.",
  },
  {
    q: "Is there a minimum or maximum loan size?",
    a: "We arrange bridging loans from £100,000 to £20m+, depending on asset value and client requirements.",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy pb-20 pt-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-gold">
            Arrange specialist short-term property funding in 48 hours
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Fast Bridging Finance for Serious Property Investors / Auction Purchasers
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-slate-300">
            Independent bridging loan specialists helping property buyers, investors, and
            developers access the best short-term finance rates in the UK with the right
            exit strategy in mind that is tailored to you.
          </p>
          <ul className="mb-10 grid gap-3 sm:grid-cols-2">
            {[
              "Property finance for complex deals",
              "Access to 200+ trusted lenders",
              "Competitive rates from 0.45% per month",
              "Flexible terms up to 36 months",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <a
              href="#enquire"
              className="inline-flex items-center rounded-lg bg-gold px-7 py-3.5 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition hover:bg-gold-light"
            >
              Book Free Consultation
            </a>
            <a
              href="tel:02071774141"
              className="inline-flex items-center rounded-lg border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Call Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section id="services" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-navy">Our Bridging Loan Services</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                <Icon className="h-6 w-6 text-gold" />
              </div>
              <h3 className="mb-2 font-semibold text-navy">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-3xl font-bold text-navy">About Our Firm</h2>
          <p className="mb-4 leading-relaxed text-slate-600">
            As a specialist bridging loan broker based in London, we provide flexible
            funding solutions for time-sensitive property transactions. Our team works
            with a wide network of private, commercial, and international lenders to
            secure bespoke terms that traditional banks can&apos;t match.
          </p>
          <p className="mb-6 leading-relaxed text-slate-600">
            We act exclusively on your behalf, ensuring your loan is structured to
            your advantage — with clear communication, fast decisions, and no
            unnecessary delays.
          </p>
          <a
            href="tel:02071774141"
            className="inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light"
          >
            Call Us To Know More About Us
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-navy p-6 text-center text-white"
            >
              <p className="text-3xl font-bold text-gold">{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhatIsBridgingLoan() {
  return (
    <section id="what-is-bridging" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-navy">What Is a Bridging Loan?</h2>
            <p className="mb-4 leading-relaxed text-slate-600">
              A bridging loan is a short-term property loan used to &ldquo;bridge&rdquo; a
              funding gap — often between buying and selling, refinancing, or completing
              time-sensitive purchases like property auctions.
            </p>
            <p className="mb-6 leading-relaxed text-slate-600">
              These loans can be secured against{" "}
              <strong>residential, commercial, or mixed-use property</strong>, and are
              ideal for:
            </p>
            <ul className="mb-8 space-y-2">
              {bridgingUseCases.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#enquire"
              className="inline-flex items-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy hover:bg-gold-light"
            >
              Discuss Your Funding Options
            </a>
          </div>
          <div className="rounded-2xl bg-navy p-8 text-white">
            <h3 className="mb-4 text-xl font-bold">Key Facts</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gold">Typical term</dt>
                <dd className="text-slate-300">3 to 36 months</dd>
              </div>
              <div>
                <dt className="text-gold">Residential LTV</dt>
                <dd className="text-slate-300">Up to 75%</dd>
              </div>
              <div>
                <dt className="text-gold">Commercial LTV</dt>
                <dd className="text-slate-300">Up to 70%</dd>
              </div>
              <div>
                <dt className="text-gold">Loan sizes</dt>
                <dd className="text-slate-300">£100,000 to £20m+</dd>
              </div>
              <div>
                <dt className="text-gold">Completion</dt>
                <dd className="text-slate-300">3–10 working days</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExpertTeam() {
  return (
    <section id="team" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-navy">
            Expert Bridging Brokers You Can Trust
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            Our brokers have decades of experience structuring high-value deals for UK
            and international clients. We understand the complexities of short-term
            finance and specialise in finding creative solutions where traditional
            lenders can&apos;t deliver.
          </p>
        </div>
        <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-navy text-3xl font-bold text-gold">
            D
          </div>
          <h3 className="text-xl font-bold text-navy">Daniel</h3>
          <p className="mt-1 text-sm font-medium text-gold">Partner</p>
          <p className="text-sm text-slate-500">Bridging Loans Specialist</p>
          <a
            href="mailto:daniel@bridgingloansbroker.co.uk"
            className="mt-4 text-sm text-navy hover:text-gold"
          >
            daniel@bridgingloansbroker.co.uk
          </a>
        </div>
      </div>
    </section>
  );
}

export function Insights() {
  return (
    <section id="insights" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-navy">Latest Expert Insights</h2>
          <p className="text-slate-600">
            Professional guidance to help you navigate bridging finance with confidence
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {insights.map((post) => (
            <article
              key={post.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {post.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                  Featured
                </span>
              )}
              <p className="mb-3 text-xs text-slate-400">
                {post.date} · {post.readTime}
              </p>
              <h3 className="mb-2 font-semibold text-navy">{post.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                    D
                  </div>
                  <span className="text-xs text-slate-500">{post.author}</span>
                </div>
                <span className="text-xs font-medium text-gold">Read More →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-10 text-center text-3xl font-bold text-navy">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-slate-200 bg-white p-5"
            >
              <summary className="cursor-pointer font-medium text-navy marker:content-none">
                <span className="flex items-center justify-between">
                  {q}
                  <span className="text-gold transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WantToTalk() {
  return (
    <section className="bg-navy py-20 text-center text-white">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="mb-3 text-4xl font-bold md:text-5xl">
          Want To Talk?
        </h2>
        <p className="mb-8 text-slate-300">
          We&apos;ll review your scenario and outline your bridging loan options within
          hours.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#enquire"
            className="rounded-lg bg-gold px-7 py-3 text-sm font-semibold text-navy hover:bg-gold-light"
          >
            Book 30 mins Free Consultation
          </a>
          <a
            href="tel:02071774141"
            className="rounded-lg border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Talk to our Experts Now
          </a>
        </div>
      </div>
    </section>
  );
}
