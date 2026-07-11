"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  captureTrackingFromUrl,
  trackMetaEvent,
  type TrackingParams,
} from "@/lib/tracking";
import { metaEventId, metaTrackingPayload, readMetaBrowserIds } from "@/lib/meta-tracking";
import { cn } from "@/lib/utils";
import {
  formatUKPhoneInput,
  isValidEmail,
  isValidUKPhone,
  normalizeUKPhone,
  ukPhoneDigitCount,
  ukPhoneValidationError,
} from "@/lib/form-validation";
import type { HealthcareDisqualifyResult } from "@/lib/healthcare-qualifications";
import {
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  TREATMENT_OPTIONS,
} from "@/lib/healthcare-lp-copy";
import { treatmentLabel, timelineLabel } from "@/lib/healthcare-qualifications";
import { HealthcareThankYouScreen } from "@/components/forms/healthcare-thank-you";
import { OptionPills } from "@/components/forms/option-pills";
import { FormErrorBanner, FormStepPanel, SecureSaveNote } from "@/components/forms/form-field-ui";
import { ChevronLeft, ChevronRight, Loader2, Lock, AlertCircle, Mail } from "lucide-react";
import { healthcarePublicPartnerDisplayName } from "@/lib/vertical-config";

type FormState = {
  treatmentType: string;
  timeline: string;
  postcode: string;
  budgetBand: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  consent: boolean;
};

const initial: FormState = {
  treatmentType: "",
  timeline: "",
  postcode: "",
  budgetBand: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  consent: false,
};

export function HealthcareLeadForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initial);
  const [tracking, setTracking] = useState<TrackingParams>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | undefined>();
  const [disqualified, setDisqualified] = useState<HealthcareDisqualifyResult | null>(null);
  const [nurture, setNurture] = useState(false);
  const [qualified, setQualified] = useState(false);

  useEffect(() => {
    setTracking(captureTrackingFromUrl());
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep1() {
    const next: Record<string, string> = {};
    if (!form.treatmentType) next.treatmentType = "Please select a treatment type";
    if (!form.timeline) next.timeline = "Please select a timeline";
    if (!form.postcode.trim()) next.postcode = "Postcode is required";
    if (!form.budgetBand) next.budgetBand = "Please select a budget band";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2() {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!isValidEmail(form.email)) next.email = "Valid email is required";
    if (!isValidUKPhone(form.phone)) {
      next.phone = ukPhoneValidationError(form.phone) ?? "Enter a valid UK mobile";
    }
    if (!form.consent) next.consent = "You must agree to be contacted";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    setErrors({});

    const eventId = metaEventId("lead", leadId ?? "new");
    trackMetaEvent(
      "Lead",
      { content_name: "Healthcare Implant Consult" },
      { eventId },
    );

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "healthcare",
          stage: "complete",
          leadId,
          ...form,
          phone: normalizeUKPhone(form.phone),
          ...tracking,
          ...readMetaBrowserIds(),
          ...metaTrackingPayload(eventId),
          landingPageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      const data = await res.json();

      if (data.disqualified) {
        if (data.nurtureEnrolled) setNurture(true);
        setDisqualified({
          qualified: false,
          code: data.code,
          title: data.title,
          message: data.message,
          nurtureEnrolled: data.nurtureEnrolled,
        });
        return;
      }

      if (!res.ok) {
        setErrors(data.errors ?? { form: "Something went wrong. Please try again." });
        return;
      }

      setLeadId(data.id);
      setQualified(true);
    } catch {
      setErrors({ form: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initial);
    setStep(1);
    setDisqualified(null);
    setNurture(false);
    setQualified(false);
    setLeadId(undefined);
    setErrors({});
  }

  if (nurture && disqualified) {
    return (
      <div id="quote-form" className="rounded-2xl border-2 border-green-200 bg-white p-6 md:p-8">
        <div className="text-center">
          <Mail className="mx-auto mb-4 h-14 w-14 text-gold" />
          <h2 className="font-display mb-3 text-xl font-medium text-navy">{disqualified.title}</h2>
          <p className="mb-6 text-sm text-slate-600">{disqualified.message}</p>
          <button
            type="button"
            onClick={resetForm}
            className="min-h-[48px] w-full rounded-md border border-slate-200 py-3 text-sm font-semibold text-navy"
          >
            Start a new enquiry
          </button>
        </div>
      </div>
    );
  }

  if (disqualified) {
    return (
      <div id="quote-form" className="rounded-2xl border-2 border-amber-200 bg-white p-6 md:p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-amber-500" />
          <h2 className="font-display mb-3 text-xl font-medium text-navy">{disqualified.title}</h2>
          <p className="mb-6 text-sm text-slate-600">{disqualified.message}</p>
          <button
            type="button"
            onClick={resetForm}
            className="min-h-[48px] w-full rounded-md border border-slate-200 py-3 text-sm font-semibold text-navy"
          >
            Start a new enquiry
          </button>
        </div>
      </div>
    );
  }

  if (qualified) {
    return (
      <HealthcareThankYouScreen
        firstName={form.firstName}
        email={form.email}
        treatmentType={form.treatmentType}
        timeline={form.timeline}
        postcode={form.postcode}
        budgetBand={form.budgetBand}
        leadId={leadId}
      />
    );
  }

  return (
    <div
      id="quote-form"
      className="rounded-2xl border border-white/10 bg-white p-5 shadow-xl sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Step {step} of 2
        </p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Lock className="h-3 w-3" aria-hidden />
          Secure
        </p>
      </div>

      {errors.form && <FormErrorBanner errors={errors} />}

      {step === 1 && (
        <FormStepPanel stepKey={1}>
          <h2 className="mb-4 text-lg font-semibold text-navy">Your implant enquiry</h2>
          <div className="space-y-4">
            <div>
              <Label>What are you interested in?</Label>
              <OptionPills
                options={TREATMENT_OPTIONS}
                value={form.treatmentType}
                onChange={(v) => setField("treatmentType", v)}
              />
              <FieldError message={errors.treatmentType} />
            </div>
            <div>
              <Label>When are you hoping to start?</Label>
              <OptionPills
                options={TIMELINE_OPTIONS}
                value={form.timeline}
                onChange={(v) => setField("timeline", v)}
              />
              <FieldError message={errors.timeline} />
            </div>
            <div>
              <Label htmlFor="hc-postcode">Your postcode</Label>
              <Input
                id="hc-postcode"
                value={form.postcode}
                onChange={(e) => setField("postcode", e.target.value.toUpperCase())}
                placeholder="e.g. SW1A 1AA"
                autoComplete="postal-code"
              />
              <FieldError message={errors.postcode} />
            </div>
            <div>
              <Label>Rough budget (optional but helps us prepare)</Label>
              <OptionPills
                options={BUDGET_OPTIONS}
                value={form.budgetBand}
                onChange={(v) => setField("budgetBand", v)}
              />
              <FieldError message={errors.budgetBand} />
            </div>
          </div>
          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </FormStepPanel>
      )}

      {step === 2 && (
        <FormStepPanel stepKey={2}>
          <h2 className="mb-4 text-lg font-semibold text-navy">Your details</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="hc-first">First name</Label>
                <Input
                  id="hc-first"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  autoComplete="given-name"
                />
                <FieldError message={errors.firstName} />
              </div>
              <div>
                <Label htmlFor="hc-last">Last name</Label>
                <Input
                  id="hc-last"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  autoComplete="family-name"
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>
            <div>
              <Label htmlFor="hc-phone">Mobile number</Label>
              <Input
                id="hc-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setField("phone", formatUKPhoneInput(e.target.value))}
                placeholder="07XXX XXXXXX"
                autoComplete="tel"
              />
              <p className="mt-1 text-xs text-slate-500">
                {ukPhoneDigitCount(form.phone)}/11 digits
              </p>
              <FieldError message={errors.phone} />
            </div>
            <div>
              <Label htmlFor="hc-email">Email</Label>
              <Input
                id="hc-email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </div>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setField("consent", e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree to be contacted by {healthcarePublicPartnerDisplayName()} about my implant consultation
                booking by phone, SMS and email. See our{" "}
                <Link href="/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            <FieldError message={errors.consent} />
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Check availability & book"
              )}
            </Button>
          </div>
          <div className="mt-3">
            <SecureSaveNote />
          </div>
        </FormStepPanel>
      )}

      {step === 2 && (
        <p className="mt-3 text-center text-xs text-slate-500">
          {treatmentLabel(form.treatmentType)} · {timelineLabel(form.timeline)} · {form.postcode}
        </p>
      )}
    </div>
  );
}
