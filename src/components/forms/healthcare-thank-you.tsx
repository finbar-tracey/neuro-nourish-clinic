"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, ExternalLink, Shield } from "lucide-react";
import { logBookingIntent } from "@/lib/booking";
import { treatmentLabel, timelineLabel } from "@/lib/healthcare-qualifications";
import { trackMetaEvent } from "@/lib/tracking";
import { healthcarePublicPartnerDisplayName } from "@/lib/vertical-config";
import { cn } from "@/lib/utils";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

function embedUrl(url: string) {
  if (!url || url.startsWith("#")) return null;
  if (url.includes("/embed/")) return url;
  return url.replace("calendly.com/", "calendly.com/embed/");
}

type HealthcareCalendlyBookingProps = {
  leadId?: string;
  firstName?: string;
  email?: string;
  className?: string;
};

function calendlyEmbedDataUrl(embed: string, firstName?: string, email?: string) {
  const params = new URLSearchParams();
  params.set("hide_gdpr_banner", "1");
  if (firstName?.trim()) params.set("name", firstName.trim());
  if (email?.trim()) params.set("email", email.trim());
  const qs = params.toString();
  return `${embed}${embed.includes("?") ? "&" : "?"}${qs}`;
}

export function HealthcareCalendlyBooking({
  leadId,
  firstName,
  email,
  className,
}: HealthcareCalendlyBookingProps) {
  const partner = healthcarePublicPartnerDisplayName();
  const embed = embedUrl(CALENDLY_URL);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!embed || !leadId) return;
    trackMetaEvent("Schedule", { content_name: "Healthcare Calendly Embed" });
  }, [embed, leadId]);

  useEffect(() => {
    if (!leadId || !opened) return;
    void logBookingIntent(leadId, "Opened Calendly booking");
    trackMetaEvent("Schedule", { content_name: "Healthcare Calendly Open" });
  }, [leadId, opened]);

  if (!CALENDLY_URL || CALENDLY_URL.startsWith("#")) {
    return (
      <div className={cn("rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900", className)}>
        <p className="font-semibold">We&apos;ll call you within 15 minutes</p>
        <p className="mt-2 text-amber-800">
          Online booking is being set up for {partner}. Check your SMS and email — a team member will
          confirm your consultation time shortly.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border-2 border-gold/25 bg-gradient-to-br from-gold/5 to-white p-4 shadow-lg shadow-gold/5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20">
          <Calendar className="h-5 w-5 text-gold-ink" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-lg font-medium text-navy sm:text-xl">Book your consultation</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Choose a time for your free implant consultation at {partner}.
          </p>
        </div>
      </div>

      <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
        30-minute consultation · Confirmation by SMS
      </p>

      {embed && (
        <>
          <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
          <div
            className="calendly-inline-widget min-h-[520px] overflow-hidden rounded-xl border border-slate-200 sm:min-h-[580px]"
            data-url={calendlyEmbedDataUrl(embed, firstName, email)}
          />
        </>
      )}

      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpened(true)}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50"
      >
        Open calendar in new tab
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      </a>
    </div>
  );
}

const TRUST = [
  { icon: Shield, title: "Free consultation", desc: "No obligation to proceed with treatment" },
  { icon: CheckCircle2, title: "Clinic-led care", desc: "Your appointment is with registered dental professionals" },
  { icon: Clock, title: "Fast confirmation", desc: "SMS and email once your time is booked" },
] as const;

type HealthcareThankYouScreenProps = {
  firstName: string;
  email: string;
  treatmentType: string;
  timeline: string;
  postcode: string;
  budgetBand: string;
  leadId?: string;
};

export type HealthcareThankYouProps = HealthcareThankYouScreenProps;

export function HealthcareThankYouScreen({
  firstName,
  email,
  leadId,
  treatmentType,
  timeline,
  postcode,
}: HealthcareThankYouScreenProps) {
  const purposeLabel = treatmentLabel(treatmentType);
  const timelineText = timelineLabel(timeline);
  useEffect(() => {
    trackMetaEvent("ViewContent", { content_name: "Healthcare Thank You" });
  }, []);

  return (
    <div
      id="quote-form"
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40"
    >
      <div className="border-b border-slate-100 px-4 py-7 text-center sm:px-6 sm:py-9">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} aria-hidden />
        </div>
        <h2 className="font-display text-2xl font-medium leading-tight text-navy sm:text-3xl">
          You&apos;re all set, {firstName}!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          Your enquiry is confirmed. Book your free consultation below — or we&apos;ll call you within
          15 minutes.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {purposeLabel} · {timelineText} · {postcode}
        </p>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <HealthcareCalendlyBooking leadId={leadId} firstName={firstName} email={email} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center sm:text-left"
            >
              <Icon className="mx-auto mb-2 h-5 w-5 text-navy sm:mx-0" aria-hidden />
              <p className="text-sm font-semibold leading-snug text-navy">{title}</p>
              <p className="mt-1 text-xs leading-snug text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
          <p className="mb-4 text-base font-semibold text-navy">What happens next</p>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                1
              </span>
              Book your consultation time above
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                2
              </span>
              Receive SMS and email confirmation
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                3
              </span>
              Attend your free implant consultation at the clinic
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
