import type { DisqualifyResult } from "@/lib/qualifications";
import { AlertCircle, Mail, Phone } from "lucide-react";

type Props = {
  result: DisqualifyResult;
  email?: string;
  onReset: () => void;
};

export function NurtureEnrolledScreen({ result, email, onReset }: Props) {
  return (
    <div
      id="quote-form"
      className="rounded-2xl border-2 border-green-200 bg-white p-6 md:p-8"
    >
      <div className="text-center">
        <Mail className="mx-auto mb-4 h-14 w-14 text-gold" />
        <h2 className="font-display mb-3 text-xl font-medium text-navy md:text-2xl">
          {result.title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          {result.message}
        </p>
        {email && (
          <p className="mb-6 rounded-lg bg-brand-cream px-4 py-3 text-sm text-navy">
            Check your inbox at <strong>{email}</strong> — your first guide
            arrives shortly.
          </p>
        )}
      </div>
      <ul className="mb-6 space-y-2 text-left text-xs text-slate-600 sm:text-sm">
        {[
          "Day 1 — Planning ahead for bridging finance",
          "Day 3 — Preparing your deal for fast approval",
          "Day 7 — Rates, LTV & costs explained",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {item}
          </li>
        ))}
        <li className="flex items-start gap-2 text-slate-500">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/50" />
          + 2 more over 30 days
        </li>
      </ul>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[48px] w-full rounded-md border border-slate-200 py-3 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          Submit a different enquiry
        </button>
        <a
          href="tel:02071774141"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light"
        >
          <Phone className="h-4 w-4" />
          Need to talk sooner? 020 7177 4141
        </a>
      </div>
    </div>
  );
}

export function DisqualifiedScreen({ result, onReset }: Omit<Props, "email">) {
  return (
    <div
      id="quote-form"
      className="rounded-2xl border-2 border-amber-200 bg-white p-6 md:p-8"
    >
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 h-14 w-14 text-amber-500" />
        <h2 className="font-display mb-3 text-xl font-medium text-navy md:text-2xl">
          {result.title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          {result.message}
        </p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[48px] w-full rounded-md border border-slate-200 py-3 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          Start a new enquiry
        </button>
        <a
          href="tel:02071774141"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light"
        >
          <Phone className="h-4 w-4" />
          Questions? Call 020 7177 4141
        </a>
      </div>
    </div>
  );
}
