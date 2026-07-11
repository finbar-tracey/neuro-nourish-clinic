"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/input";
import {
  LOAN_PURPOSES,
  PROPERTY_TYPES,
  TERM_OPTIONS,
  TIMEFRAMES,
  type LeadFormData,
} from "@/lib/validations";
import { cn, formatCurrency } from "@/lib/utils";
import { checkLeadQualification, type DisqualifyResult } from "@/lib/qualifications";
import {
  DisqualifiedScreen,
  NurtureEnrolledScreen,
} from "@/components/forms/disqualified-screen";
import { isLongTimeframe } from "@/lib/timeframes";
import { YesNoField } from "@/components/forms/yes-no-field";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { trackMetaEvent } from "@/lib/tracking";
import { metaEventId, metaTrackingPayload } from "@/lib/meta-tracking";

const STEPS = [
  { id: 1, title: "Your needs", description: "Loan amount & purpose" },
  { id: 2, title: "Your details", description: "Contact information" },
  { id: 3, title: "Almost done", description: "Property & eligibility" },
];

type FormState = Omit<
  Partial<LeadFormData>,
  "consent" | "willOccupy" | "hasEverOccupied"
> & {
  consent?: boolean;
  willOccupy?: boolean | null;
  hasEverOccupied?: boolean | null;
  nurtureConsent?: boolean;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  loanPurpose: "",
  loanAmount: undefined,
  termMonths: 12,
  propertyType: "",
  propertyValue: undefined,
  propertyLocation: "",
  ltv: "",
  timeframe: "",
  hasExistingMortgage: false,
  willOccupy: null,
  hasEverOccupied: null,
  additionalInfo: "",
  consent: false,
  nurtureConsent: false,
};

export function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [disqualified, setDisqualified] = useState<DisqualifyResult | null>(null);

  function update(
    field: keyof FormState,
    value: string | number | boolean | null | undefined,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function isNurturePath() {
    return isLongTimeframe(form.timeframe ?? "");
  }

  function validateStep(currentStep: number): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.loanPurpose) newErrors.loanPurpose = "Required";
      if (!form.loanAmount) newErrors.loanAmount = "Required";
      if (!form.termMonths) newErrors.termMonths = "Required";
      if (!form.timeframe) newErrors.timeframe = "Required";
    }

    if (currentStep === 2) {
      if (!form.firstName?.trim()) newErrors.firstName = "Required";
      if (!form.lastName?.trim()) newErrors.lastName = "Required";
      if (!form.email?.includes("@")) newErrors.email = "Valid email required";
      if (!form.phone || form.phone.length < 10) newErrors.phone = "Valid phone required";
      if (!form.consent) newErrors.consent = "You must agree to be contacted";
    }

    if (currentStep === 3 && isNurturePath()) {
      if (!form.nurtureConsent) newErrors.nurtureConsent = "Please agree to receive guides";
    }

    if (currentStep === 3 && !isNurturePath()) {
      if (!form.propertyType) newErrors.propertyType = "Required";
      if (!form.propertyValue || form.propertyValue < 50000)
        newErrors.propertyValue = "Required";
      if (!form.propertyLocation?.trim()) newErrors.propertyLocation = "Required";
      if (form.willOccupy === null || form.willOccupy === undefined)
        newErrors.willOccupy = "Please select an option";
      if (form.hasEverOccupied === null || form.hasEverOccupied === undefined)
        newErrors.hasEverOccupied = "Please select an option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function runQualificationCheck(): DisqualifyResult | null {
    if (!form.loanAmount) return null;
    const result = checkLeadQualification({
      loanAmount: form.loanAmount,
      willOccupy: form.willOccupy ?? false,
      hasEverOccupied: form.hasEverOccupied ?? false,
    });
    return result.qualified ? null : result;
  }

  async function captureContact() {
    setSubmitting(true);
    const checkoutEventId = metaEventId("checkout");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "capture",
          leadId: leadId ?? undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          loanPurpose: form.loanPurpose,
          loanAmount: form.loanAmount,
          timeframe: form.timeframe,
          consent: true,
          source: "landing_page",
          ...metaTrackingPayload(checkoutEventId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          return false;
        }
        throw new Error();
      }
      if (data.id) setLeadId(data.id);
      trackMetaEvent(
        "InitiateCheckout",
        { content_name: "Bridging Quote Step 2 — Contact Captured" },
        { eventId: checkoutEventId },
      );
      return true;
    } catch {
      setErrors({ submit: "Something went wrong. Please try again or call us." });
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    if (!validateStep(step)) return;

    if (step === 2) {
      const saved = await captureContact();
      if (saved) setStep(3);
      return;
    }

    setStep((s) => Math.min(s + 1, 3));
  }

  function resetForm() {
    setForm(initialState);
    setLeadId(null);
    setStep(1);
    setErrors({});
    setDisqualified(null);
    setSubmitted(false);
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    if (!validateStep(3)) return;

    if (!isNurturePath()) {
      const dq = runQualificationCheck();
      if (dq) {
        setDisqualified(dq);
        return;
      }
    }

    setSubmitting(true);
    const leadEventId = metaEventId("lead", leadId ?? undefined);
    try {
      const payload = isNurturePath()
        ? {
            leadId: leadId ?? undefined,
            ...form,
            willOccupy: false,
            hasEverOccupied: false,
            propertyType: "unspecified",
            propertyValue: form.loanAmount,
            propertyLocation: "Timeline over 3 months",
            termMonths: form.termMonths ?? 12,
            hasExistingMortgage: false,
            consent: true,
            ...metaTrackingPayload(leadEventId),
          }
        : {
            leadId: leadId ?? undefined,
            ...form,
            willOccupy: form.willOccupy ?? false,
            hasEverOccupied: form.hasEverOccupied ?? false,
            consent: true,
            ...metaTrackingPayload(leadEventId),
          };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.nurtureEnrolled) {
          setDisqualified({
            qualified: false,
            code: "long_timeframe",
            nurtureEnrolled: true,
            title: data.title,
            message: data.message,
          });
          return;
        }
        if (data.disqualified) {
          setDisqualified(data);
          return;
        }
        if (data.errors) {
          setErrors(data.errors);
          return;
        }
        throw new Error(data.error ?? "Submission failed");
      }

      trackMetaEvent(
        "Lead",
        { content_name: "Bridging Loan Quote" },
        { eventId: leadEventId },
      );
      setSubmitted(true);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again or call us." });
    } finally {
      setSubmitting(false);
    }
  }

  if (disqualified) {
    if (disqualified.nurtureEnrolled) {
      return (
        <NurtureEnrolledScreen
          result={disqualified}
          email={form.email ?? ""}
          onReset={resetForm}
        />
      );
    }
    return <DisqualifiedScreen result={disqualified} onReset={resetForm} />;
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
        <h3 className="mb-2 text-2xl font-bold text-navy">Enquiry Received</h3>
        <p className="mb-6 text-slate-600">
          Thank you, {form.firstName}. Our team will review your scenario and
          outline your bridging loan options within hours.
        </p>
        <a
          href="tel:02071774141"
          className="text-sm font-medium text-gold hover:underline"
        >
          Or call us now: 020 7177 4141
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
                    step > s.id
                      ? "bg-gold text-navy"
                      : step === s.id
                        ? "bg-navy text-white"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                <p
                  className={cn(
                    "mt-1 hidden text-xs sm:block",
                    step >= s.id ? "text-navy font-medium" : "text-slate-400",
                  )}
                >
                  {s.title}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    step > s.id ? "bg-gold" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-navy">Your needs</h3>
              <p className="text-sm text-slate-500">
                Quick questions — no personal details yet
              </p>
            </div>
            <div>
              <Label htmlFor="loanPurpose">Loan Purpose</Label>
              <Select
                id="loanPurpose"
                value={form.loanPurpose ?? ""}
                onChange={(e) => update("loanPurpose", e.target.value)}
              >
                <option value="">Select purpose...</option>
                {LOAN_PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.loanPurpose} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loanAmount">Loan Amount (£)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  min={1}
                  step={10000}
                  value={form.loanAmount ?? ""}
                  onChange={(e) =>
                    update(
                      "loanAmount",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="250000"
                />
                <FieldError message={errors.loanAmount} />
              </div>
              <div>
                <Label htmlFor="termMonths">Loan Term</Label>
                <Select
                  id="termMonths"
                  value={form.termMonths ?? 12}
                  onChange={(e) => update("termMonths", Number(e.target.value))}
                >
                  {TERM_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.termMonths} />
              </div>
            </div>
            <div>
              <Label htmlFor="timeframe">When do you need funding?</Label>
              <Select
                id="timeframe"
                value={form.timeframe ?? ""}
                onChange={(e) => update("timeframe", e.target.value)}
              >
                <option value="">Select timeframe...</option>
                {TIMEFRAMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.timeframe} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-navy">Your details</h3>
              <p className="text-sm text-slate-500">
                So we can prepare options for your{" "}
                {form.loanAmount ? formatCurrency(form.loanAmount) : ""} enquiry
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName ?? ""}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="John"
                />
                <FieldError message={errors.firstName} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName ?? ""}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Smith"
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                placeholder="john@example.com"
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="07XXX XXXXXX"
              />
              <FieldError message={errors.phone} />
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent ?? false}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-sm text-slate-600">
                I agree to be contacted by Bridging Loans Broker regarding my enquiry.
              </span>
            </label>
            <FieldError message={errors.consent} />
            <FieldError message={errors.submit} />
          </div>
        )}

        {step === 3 && isNurturePath() && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-slate-700">
              <p className="font-semibold text-navy">Planning ahead?</p>
              <p className="mt-1">
                Bridging finance is for urgent deals within 3 months. We&apos;ll send
                you a free email guide series to help you prepare.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.nurtureConsent ?? false}
                onChange={(e) => update("nurtureConsent", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-sm text-slate-600">
                I agree to receive bridging finance guides and updates by email.
              </span>
            </label>
            <FieldError message={errors.nurtureConsent} />
            <FieldError message={errors.submit} />
          </div>
        )}

        {step === 3 && !isNurturePath() && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-navy">Property & eligibility</h3>
              <p className="text-sm text-slate-500">
                Last step — helps us check if bridging is right for you
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  id="propertyType"
                  value={form.propertyType ?? ""}
                  onChange={(e) => update("propertyType", e.target.value)}
                >
                  <option value="">Select type...</option>
                  {PROPERTY_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.propertyType} />
              </div>
              <div>
                <Label htmlFor="propertyValue">Property Value (£)</Label>
                <Input
                  id="propertyValue"
                  type="number"
                  min={50000}
                  step={10000}
                  value={form.propertyValue ?? ""}
                  onChange={(e) => update("propertyValue", Number(e.target.value))}
                  placeholder="350000"
                />
                <FieldError message={errors.propertyValue} />
              </div>
            </div>
            <div>
              <Label htmlFor="propertyLocation">Property Location</Label>
              <Input
                id="propertyLocation"
                value={form.propertyLocation ?? ""}
                onChange={(e) => update("propertyLocation", e.target.value)}
                placeholder="London, SW1"
              />
              <FieldError message={errors.propertyLocation} />
            </div>
            <div>
              <Label htmlFor="ltv">Estimated LTV (optional)</Label>
              <Input
                id="ltv"
                value={form.ltv ?? ""}
                onChange={(e) => update("ltv", e.target.value)}
                placeholder="e.g. 70%"
              />
            </div>
            <div>
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={form.additionalInfo ?? ""}
                onChange={(e) => update("additionalInfo", e.target.value)}
                placeholder="Exit strategy or other relevant details..."
              />
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <YesNoField
                id="ms-will-occupy"
                label="Do you intend to live in this property (now or in the future)?"
                hint="We only arrange finance for business and investment purposes."
                value={form.willOccupy ?? null}
                onChange={(val) => update("willOccupy", val)}
                error={errors.willOccupy}
              />
              <YesNoField
                id="ms-ever-occupied"
                label="Have you or a family member ever lived in this property?"
                value={form.hasEverOccupied ?? null}
                onChange={(val) => update("hasEverOccupied", val)}
                error={errors.hasEverOccupied}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.hasExistingMortgage ?? false}
                onChange={(e) => update("hasExistingMortgage", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-sm text-slate-600">
                There is an existing mortgage on the property
              </span>
            </label>
            <FieldError message={errors.submit} />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={back} type="button">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button onClick={next} type="button" disabled={submitting}>
              {submitting && step === 2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} type="button">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : isNurturePath() ? (
                "Send Me the Guide Series"
              ) : (
                "Submit Enquiry"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
