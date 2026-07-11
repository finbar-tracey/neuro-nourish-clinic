"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  QualifiedThankYouScreen,
  type QualifiedThankYouProps,
} from "@/components/forms/qualified-thank-you";
import { SiteHeader } from "@/components/landing/site-header";
import { borrowerResumeUrl, normalizeLeadId } from "@/lib/sms-links";

const DANIEL_PHONE = "020 7177 4141";
const DANIEL_PHONE_TEL = "02071774141";

type LoadState = "loading" | "ready" | "error";

export function BookPageClient() {
  const searchParams = useSearchParams();
  const rawLeadId = searchParams.get("lead");
  const leadId = normalizeLeadId(rawLeadId);
  const [lead, setLead] = useState<QualifiedThankYouProps | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rawLeadId) {
      setState("error");
      setError("This booking link is missing your enquiry reference.");
      return;
    }

    if (!leadId) {
      setState("error");
      setError("This booking link is invalid. Use the link from your email or SMS.");
      return;
    }

    let cancelled = false;

    void (async () => {
      setState("loading");
      setError(null);
      setResumeUrl(null);

      const res = await fetch(`/api/leads/${leadId}/session`);
      if (cancelled) return;

      if (res.status === 429) {
        setState("error");
        setError("Too many requests. Please wait a moment and refresh this page.");
        return;
      }

      if (res.status === 404) {
        setState("error");
        setError(
          "We couldn't find your enquiry. If you completed the form recently, try the link in your latest email or SMS. Otherwise start a new quote below.",
        );
        return;
      }

      if (!res.ok) {
        setState("error");
        setError("Something went wrong loading your booking. Please call us or start a new quote.");
        return;
      }

      const data = (await res.json()) as QualifiedThankYouProps & { formCompleted?: boolean };
      if (!data.formCompleted) {
        const url = borrowerResumeUrl(leadId);
        setResumeUrl(url);
        setState("error");
        setError("Please complete your eligibility check first — we'll take you there now.");
        window.location.replace(url);
        return;
      }

      setLead({ ...data, leadId });
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [rawLeadId, leadId]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-brand-cream px-4 py-10">
        {state === "loading" && (
          <p className="mx-auto max-w-lg text-center text-sm text-slate-600">
            Loading your booking…
          </p>
        )}

        {state === "error" && error && (
          <div className="mx-auto max-w-lg space-y-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {resumeUrl && (
                <Link
                  href={resumeUrl}
                  className="inline-flex rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Complete eligibility check
                </Link>
              )}
              <Link
                href="/lp"
                className="inline-flex rounded-lg border border-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy"
              >
                Start a new quote
              </Link>
              <a
                href={`tel:${DANIEL_PHONE_TEL}`}
                className="text-sm font-semibold text-brand-orange underline"
              >
                Call {DANIEL_PHONE}
              </a>
            </div>
          </div>
        )}

        {state === "ready" && lead && (
          <QualifiedThankYouScreen
            firstName={lead.firstName}
            loanAmount={lead.loanAmount}
            loanPurpose={lead.loanPurpose}
            timeframe={lead.timeframe}
            propertyType={lead.propertyType}
            propertyLocation={lead.propertyLocation}
            leadId={leadId ?? undefined}
          />
        )}
      </main>
    </>
  );
}
