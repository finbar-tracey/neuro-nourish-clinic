"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  captureTrackingFromUrl,
  trackMetaEvent,
  type TrackingParams,
} from "@/lib/tracking";
import { metaEventId, metaTrackingPayload } from "@/lib/meta-tracking";
import { isValidEmail } from "@/lib/form-validation";
import {
  formatPhoneInput,
  normalizePhone,
  phoneDigitHint,
  phoneValidationError,
} from "@/lib/phone-ie";
import { NN_CONCERN_OPTIONS, NN_CLINICIAN_PARTNERSHIP, NN_DISCOVERY } from "@/lib/neuronourish-copy";
import { OptionPills } from "@/components/forms/option-pills";
import { FormErrorBanner } from "@/components/forms/form-field-ui";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ExpressionOfInterestForm({
  intent = "contact",
  submitLabel = "Submit",
  leadId,
}: {
  intent?: "contact" | "discovery" | "partnership";
  submitLabel?: string;
  leadId?: string;
}) {
  const isPartnership = intent === "partnership";
  const isDiscovery = intent === "discovery";
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    clinicName: "",
    primaryConcern: "",
    message: isPartnership
      ? "I'd like to request a clinical briefing and partnership overview."
      : isDiscovery
        ? ""
        : "",
    consent: false,
  });
  const [tracking, setTracking] = useState<TrackingParams>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setTracking(captureTrackingFromUrl());
  }, []);

  useEffect(() => {
    if (isDiscovery) {
      firstNameRef.current?.focus();
    }
  }, [isDiscovery]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!isValidEmail(form.email)) next.email = "Valid email required";
    const pe = phoneValidationError(form.phone);
    if (pe) next.phone = pe;
    if (!form.primaryConcern) {
      next.primaryConcern = isPartnership ? "Please select your practice type" : "Please select";
    }
    if (isPartnership && !form.clinicName.trim()) {
      next.clinicName = "Business / clinic name required";
    }
    if (!form.consent) next.consent = "Consent required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    const eventId = metaEventId("eoi", "new");
    trackMetaEvent("Lead", { eventID: eventId });

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vertical: "neuronourish",
        ...(isDiscovery
          ? { funnelStage: "discovery_requested" }
          : { stage: "complete", funnelStage: "eoi_submitted" }),
        leadId: leadId || undefined,
        segment:
          isPartnership && form.primaryConcern === "employer_oh"
            ? "employer"
            : isPartnership || form.primaryConcern === "healthcare_partnership"
              ? "clinician"
              : undefined,
        source: isPartnership
          ? form.primaryConcern === "employer_oh"
            ? "employer_wellness"
            : "clinics_partnership"
          : isDiscovery
            ? "discovery_page"
            : undefined,
        ...form,
        message:
          form.message.trim() ||
          (isDiscovery ? "I'd like to schedule a complimentary discovery call." : undefined),
        clinicName: isPartnership ? form.clinicName.trim() || undefined : undefined,
        phone: normalizePhone(form.phone),
        ...tracking,
        ...metaTrackingPayload(eventId),
      }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else {
      let message = "Something went wrong. Please try again.";
      try {
        const body = (await res.json()) as { error?: string; errors?: Record<string, string> };
        if (body.errors) {
          setErrors(body.errors);
          return;
        }
        if (body.error) message = body.error;
      } catch {
        /* ignore */
      }
      setErrors({ form: message });
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-linen bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold" aria-hidden />
        <p className="mt-4 font-display text-xl text-deep-slate">
          {isDiscovery ? NN_DISCOVERY.successTitle : "Thank you"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          {isDiscovery
            ? NN_DISCOVERY.successBody
            : isPartnership
              ? NN_CLINICIAN_PARTNERSHIP.successMessage
              : "We'll be in touch shortly."}
        </p>
        {!isPartnership ? (
          <div className="mt-6">
            <Link
              href={leadId ? `/quiz?leadId=${encodeURIComponent(leadId)}` : "/quiz"}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-6 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90"
            >
              {isDiscovery ? NN_DISCOVERY.successQuizCta : "Or take the brain health quiz now"}
            </Link>
            {isDiscovery ? (
              <p className="mt-2 text-xs text-ink/55">{NN_DISCOVERY.successQuizHint}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const phoneHint = phoneDigitHint(form.phone);

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-linen bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      {errors.form ? <FormErrorBanner errors={{ form: errors.form }} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="eoi-first-name">First name</Label>
          <Input
            ref={firstNameRef}
            id="eoi-first-name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <Label htmlFor="eoi-last-name">Last name</Label>
          <Input
            id="eoi-last-name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>
      <div>
        <Label htmlFor="eoi-email">
          {isPartnership ? NN_CLINICIAN_PARTNERSHIP.emailLabel : "Email"}
        </Label>
        <Input
          id="eoi-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <FieldError message={errors.email} />
      </div>
      <div>
        <Label htmlFor="eoi-phone">Mobile</Label>
        <Input
          id="eoi-phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) })}
          aria-describedby={phoneHint ? "eoi-phone-hint" : undefined}
        />
        {phoneHint && !errors.phone ? (
          <p id="eoi-phone-hint" className="mt-1 text-xs text-ink/55">
            {phoneHint}
          </p>
        ) : null}
        <FieldError message={errors.phone} />
      </div>
      {isPartnership ? (
        <div>
          <Label htmlFor="eoi-clinic">{NN_CLINICIAN_PARTNERSHIP.clinicNameLabel}</Label>
          <Input
            id="eoi-clinic"
            value={form.clinicName}
            onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
            placeholder={NN_CLINICIAN_PARTNERSHIP.clinicNamePlaceholder}
          />
          <FieldError message={errors.clinicName} />
        </div>
      ) : null}
      <div>
        <Label>{isPartnership ? NN_CLINICIAN_PARTNERSHIP.roleLabel : "What brings you to NeuroNourish?"}</Label>
        <OptionPills
          options={
            isPartnership
              ? NN_CLINICIAN_PARTNERSHIP.roleOptions.map((o) => ({ value: o.value, label: o.label }))
              : NN_CONCERN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
          }
          value={form.primaryConcern}
          onChange={(v) => setForm({ ...form, primaryConcern: v })}
          className="mt-2"
        />
        <FieldError message={errors.primaryConcern} />
      </div>
      <div>
        <Label htmlFor="eoi-message">Message (optional)</Label>
        <textarea
          id="eoi-message"
          className="mt-1 w-full rounded-md border border-linen px-3 py-2 text-sm"
          rows={3}
          placeholder={
            isDiscovery
              ? "Anything you'd like us to know before the call…"
              : undefined
          }
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <label className="flex gap-3 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          className="mt-1"
        />
        {isPartnership
          ? NN_CLINICIAN_PARTNERSHIP.consent
          : "I agree to be contacted about NeuroNourish programmes."}
      </label>
      <FieldError message={errors.consent} />
      <Button
        type="submit"
        disabled={submitting}
        className="min-h-[48px] w-full bg-gold text-deep-slate hover:bg-gold/90"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
      {isDiscovery ? (
        <p className="text-center text-xs text-ink/55">{NN_DISCOVERY.ctaHint}</p>
      ) : null}
    </form>
  );
}
