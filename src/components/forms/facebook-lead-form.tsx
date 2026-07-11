"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  LOAN_PURPOSES,
} from "@/lib/validations";
import {
  AD_ANGLES,
  QUICK_LOAN_AMOUNTS,
  QUICK_LOAN_PURPOSES,
  QUICK_PROPERTY_TYPES,
  QUICK_PROPERTY_VALUES,
  parseAdAngle,
  type AdAngle,
} from "@/lib/ad-angles";
import {
  captureTrackingFromUrl,
  trackMetaEvent,
  type TrackingParams,
} from "@/lib/tracking";
import { metaEventId, metaTrackingPayload, readMetaBrowserIds } from "@/lib/meta-tracking";
import { cn, formatCurrency } from "@/lib/utils";
import {
  FORM_STORAGE_KEY,
  formatMoneyInput,
  formatUKPhoneInput,
  isValidEmail,
  isValidUKPhone,
  normalizeUKPhone,
  ukPhoneDigitCount,
  ukPhoneValidationError,
  parseMoneyInput,
  parseFormUrlParams,
  validateLoanAmount,
} from "@/lib/form-validation";
import { normalizeLeadId } from "@/lib/sms-links";
import { isLongTimeframe, QUICK_TIMEFRAMES, timeframeShortLabel } from "@/lib/timeframes";
import type { DisqualifyResult } from "@/lib/qualifications";
import {
  DisqualifiedScreen,
  NurtureEnrolledScreen,
} from "@/components/forms/disqualified-screen";
import { QualifiedThankYouScreen } from "@/components/forms/qualified-thank-you";
import { OptionPills } from "@/components/forms/option-pills";
import {
  CaptureSavedBanner,
  FormErrorBanner,
  FormStepPanel,
  LoanPurposePicker,
  MoneyQuickPicker,
  SecureSaveNote,
  Step2ValueProposition,
  StepCtaHint,
  StepFieldProgress,
} from "@/components/forms/form-field-ui";
import { YesNoField } from "@/components/forms/yes-no-field";
import { DanielExpertCard } from "@/components/landing/daniel-expert";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { ConversionTrustLine } from "@/components/landing/conversion-trust-line";
import { RegulatoryTrustStrip } from "@/components/landing/regulatory-trust-strip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";

const FB_STEPS = [
  { id: 1, title: "Your needs" },
  { id: 2, title: "Your details" },
  { id: 3, title: "Almost done" },
];

const FB_STEP_BENEFITS: Record<number, string> = {
  1: "Easy questions first — no personal details yet",
  2: "Free review against 200+ lenders",
  3: "Check eligibility & get your enquiry outcome",
};

const STEP_CTA_HINTS: Record<number, string> = {
  1: "No credit check · ~60 seconds · 100% free",
  2: "Saved securely · Daniel notified immediately",
  3: "Free quote · No hard credit check",
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  loanPurpose: string;
  loanAmount: number | undefined;
  timeframe: string;
  propertyType: string;
  propertyLocation: string;
  propertyValue: number | undefined;
  willOccupy: boolean | null;
  hasEverOccupied: boolean | null;
  investmentOnly: boolean | null;
  consent: boolean;
  nurtureConsent: boolean;
};

const initial: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  loanPurpose: "",
  loanAmount: undefined,
  timeframe: "",
  propertyType: "",
  propertyLocation: "",
  propertyValue: undefined,
  willOccupy: null,
  hasEverOccupied: null,
  investmentOnly: null,
  consent: false,
  nurtureConsent: false,
};

const FIELD_IDS: Record<string, string> = {
  loanPurpose: "fb-purpose",
  loanAmount: "fb-amount",
  timeframe: "fb-time",
  firstName: "fb-first",
  lastName: "fb-last",
  phone: "fb-phone",
  email: "fb-email",
  propertyType: "fb-ptype",
  propertyLocation: "fb-loc",
  propertyValue: "fb-pval",
};

function focusFirstError(errorKeys: Record<string, string>) {
  const order = Object.keys(FIELD_IDS);
  const first = order.find((k) => errorKeys[k]);
  if (first) {
    const el = document.getElementById(FIELD_IDS[first]!);
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    });
  }
}

export function FacebookLeadForm({ angle = "default" }: { angle?: AdAngle }) {
  const angleConfig = AD_ANGLES[angle];

  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    loanPurpose: angleConfig.defaultLoanPurpose,
    timeframe: angleConfig.defaultTimeframe,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [disqualified, setDisqualified] = useState<DisqualifyResult | null>(null);
  const [tracking, setTracking] = useState<TrackingParams>({});
  const [customAmountOpen, setCustomAmountOpen] = useState(false);
  const [customPropertyOpen, setCustomPropertyOpen] = useState(false);
  const [showAllPurposes, setShowAllPurposes] = useState(false);
  const [resumedSession, setResumedSession] = useState(false);
  const [stepAnimating, setStepAnimating] = useState(false);
  const [contactCaptured, setContactCaptured] = useState(false);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  function scrollToForm(block: ScrollLogicalPosition = "start") {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("quote-form")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block,
    });
  }

  useEffect(() => {
    setTracking(captureTrackingFromUrl());
    const params = new URLSearchParams(window.location.search);
    const urlAngle = parseAdAngle(params.get("angle"));
    const urlForm = parseFormUrlParams(window.location.search);
    if (urlAngle !== "default") {
      const cfg = AD_ANGLES[urlAngle];
      setForm((prev) => ({
        ...prev,
        loanPurpose: cfg.defaultLoanPurpose || prev.loanPurpose,
        timeframe: cfg.defaultTimeframe || prev.timeframe,
      }));
    }
    setForm((prev) => ({
      ...prev,
      ...(urlForm.loanAmount ? { loanAmount: urlForm.loanAmount } : {}),
      ...(urlForm.loanPurpose ? { loanPurpose: urlForm.loanPurpose } : {}),
      ...(urlForm.timeframe ? { timeframe: urlForm.timeframe } : {}),
    }));
    if (urlForm.loanPurpose && !QUICK_LOAN_PURPOSES.some((p) => p.value === urlForm.loanPurpose)) {
      setShowAllPurposes(true);
    }
    try {
      const raw = localStorage.getItem(FORM_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          form?: Partial<FormState>;
          step?: number;
          leadId?: string | null;
        };
        if (saved.form) {
          setForm((prev) => ({ ...prev, ...saved.form }));
        }
        if (saved.step && saved.step >= 1 && saved.step <= 3) {
          setStep(saved.step);
          if (saved.step > 1) setResumedSession(true);
        }
        if (saved.leadId) {
          setLeadId(saved.leadId);
          if (saved.step === 3) setContactCaptured(true);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }

    const urlLead = normalizeLeadId(params.get("lead"));
    const urlStep = params.get("step");
    const urlBook = params.get("book") === "1";
    const resumeFromUrl = urlStep === "3" || urlBook;
    if (urlLead && resumeFromUrl) {
      void fetch(`/api/leads/${urlLead}/session`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: {
          id: string;
          firstName: string;
          loanAmount: number;
          loanPurpose: string;
          timeframe: string;
          propertyType: string;
          propertyLocation?: string;
          formCompleted?: boolean;
        } | null) => {
          if (!data) return;

          setLeadId(data.id);
          setForm((prev) => ({
            ...prev,
            firstName: data.firstName,
            loanAmount: data.loanAmount,
            loanPurpose: data.loanPurpose,
            timeframe: data.timeframe,
            propertyType: data.propertyType,
            propertyLocation: data.propertyLocation ?? prev.propertyLocation,
          }));

          if (data.formCompleted && (urlStep === "3" || urlBook)) {
            setSubmitted(true);
            setResumedSession(true);
            scrollToForm("start");
            return;
          }

          if (data.formCompleted) return;

          if (urlStep === "3") {
            setStep(3);
            setContactCaptured(true);
            setResumedSession(true);
          }
        })
        .catch(() => null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          FORM_STORAGE_KEY,
          JSON.stringify({ form, step, leadId }),
        );
      } catch {
        /* quota exceeded */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form, step, leadId]);

  function clearFormStorage() {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const focusId =
      step === 1 ? "fb-purpose" : step === 2 ? "fb-first" : "fb-ptype";

    if (isMobile && stepContentRef.current) {
      requestAnimationFrame(() => {
        stepContentRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      });
    } else if (focusId && !isMobile) {
      requestAnimationFrame(() => document.getElementById(focusId)?.focus());
    }
  }, [step]);

  useEffect(() => {
    if (
      form.loanAmount &&
      !QUICK_LOAN_AMOUNTS.some((a) => a.value === form.loanAmount)
    ) {
      setCustomAmountOpen(true);
    }
  }, [form.loanAmount]);

  useEffect(() => {
    if (
      form.propertyValue &&
      !QUICK_PROPERTY_VALUES.some((a) => a.value === form.propertyValue)
    ) {
      setCustomPropertyOpen(true);
    }
  }, [form.propertyValue]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateField(field: keyof FormState) {
    const e: Record<string, string> = {};
    if (field === "firstName" && !form.firstName.trim()) e.firstName = "First name required";
    if (field === "lastName" && !form.lastName.trim()) e.lastName = "Last name required";
    if (field === "phone" && form.phone) {
      const phoneError = ukPhoneValidationError(form.phone);
      if (phoneError) e.phone = phoneError;
    }
    if (field === "email" && form.email && !isValidEmail(form.email)) {
      e.email = "Enter a valid email address";
    }
    if (Object.keys(e).length > 0) {
      setErrors((prev) => ({ ...prev, ...e }));
    }
  }

  function isNurturePath() {
    return isLongTimeframe(form.timeframe);
  }

  function validate(current: number) {
    const e: Record<string, string> = {};
    if (current === 1) {
      if (!form.loanPurpose) e.loanPurpose = "Please select a purpose";
      const amountErr = validateLoanAmount(form.loanAmount);
      if (amountErr) e.loanAmount = amountErr;
      if (!form.timeframe) e.timeframe = "Please select a timeframe";
    }
    if (current === 2) {
      if (!form.firstName.trim()) e.firstName = "First name required";
      if (!form.lastName.trim()) e.lastName = "Last name required";
      const phoneError = ukPhoneValidationError(form.phone);
      if (phoneError) e.phone = phoneError;
      if (!isValidEmail(form.email)) e.email = "Enter a valid email address";
      if (!form.consent) e.consent = "Please agree to be contacted";
    }
    if (current === 3 && isNurturePath()) {
      if (!form.nurtureConsent) e.nurtureConsent = "Please agree to receive guides";
    }
    if (current === 3 && !isNurturePath()) {
      if (form.investmentOnly === null) e.investmentOnly = "Please select an option";
      if (form.willOccupy === null) e.willOccupy = "Please select an option";
      if (form.hasEverOccupied === null) e.hasEverOccupied = "Please select an option";
      if (!form.propertyType) e.propertyType = "Required";
      if (!form.propertyLocation.trim()) e.propertyLocation = "Required";
      if (!form.propertyValue || form.propertyValue < 50000) e.propertyValue = "Minimum £50,000";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) focusFirstError(e);
    return Object.keys(e).length === 0;
  }

  async function disqualifyFromScreening(
    willOccupy: boolean,
    hasEverOccupied: boolean,
  ) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId ?? undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: normalizeUKPhone(form.phone),
          loanPurpose: form.loanPurpose,
          loanAmount: form.loanAmount,
          timeframe: form.timeframe,
          propertyType: form.propertyType || "unspecified",
          propertyValue: form.propertyValue ?? form.loanAmount ?? 50_000,
          propertyLocation: form.propertyLocation.trim() || "Not provided",
          willOccupy,
          hasEverOccupied,
          termMonths: 12,
          hasExistingMortgage: false,
          consent: true,
          source: "facebook_lp",
          adAngle: angle,
          ...tracking,
        }),
      });
      const data = await res.json();
      clearFormStorage();
      if (data.disqualified) {
        setDisqualified(data);
        return;
      }
      setDisqualified({
        qualified: false,
        code: "occupancy",
        title: "Unable to assist with this enquiry",
        message:
          "Bridging Loans Broker provides unregulated bridging finance for business and investment purposes only. We cannot arrange finance where you intend to live in the property, or where you or a family member has previously lived in it. Please contact an FCA-regulated mortgage adviser for residential finance.",
      });
    } catch {
      setErrors({ submit: "Something went wrong — please call 020 7177 4141" });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  function handleScreeningAnswer(
    field: "investmentOnly" | "willOccupy" | "hasEverOccupied",
    value: boolean,
  ) {
    update(field, value);
    const next = {
      investmentOnly: field === "investmentOnly" ? value : form.investmentOnly,
      willOccupy: field === "willOccupy" ? value : form.willOccupy,
      hasEverOccupied: field === "hasEverOccupied" ? value : form.hasEverOccupied,
    };
    if (next.investmentOnly === false) {
      void disqualifyFromScreening(true, false);
      return;
    }
    if (next.willOccupy === true) {
      void disqualifyFromScreening(true, next.hasEverOccupied ?? false);
      return;
    }
    if (next.hasEverOccupied === true) {
      void disqualifyFromScreening(false, true);
    }
  }

  async function captureContact() {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const checkoutEventId = metaEventId("checkout", leadId ?? undefined);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "capture",
          leadId: leadId ?? undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: normalizeUKPhone(form.phone),
          loanPurpose: form.loanPurpose,
          loanAmount: form.loanAmount,
          timeframe: form.timeframe,
          consent: true,
          source: "facebook_lp",
          adAngle: angle,
          ...tracking,
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
      setContactCaptured(true);
      trackMetaEvent(
        "InitiateCheckout",
        {
          content_name: "Bridging Quote Step 2 — Contact Captured",
        },
        { eventId: checkoutEventId },
      );
      return true;
    } catch {
      setErrors({ submit: "Something went wrong — please call 020 7177 4141" });
      return false;
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  function advanceStep(to: number) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStep(to);
      return;
    }
    setStepAnimating(true);
    window.setTimeout(() => {
      setStep(to);
      setStepAnimating(false);
    }, 220);
  }

  async function handleContinueFromStep(current: number) {
    if (!validate(current)) return;

    if (current === 1) {
      const step1EventId = metaEventId("checkout-step1");
      trackMetaEvent(
        "InitiateCheckout",
        {
          content_name: "Bridging Quote Step 1",
        },
        { eventId: step1EventId },
      );
      advanceStep(2);
      return;
    }

    if (current === 2) {
      const saved = await captureContact();
      if (saved) advanceStep(3);
    }
  }

  function resetForm() {
    clearFormStorage();
    setResumedSession(false);
    setForm({
      ...initial,
      loanPurpose: angleConfig.defaultLoanPurpose,
      timeframe: angleConfig.defaultTimeframe,
    });
    setStep(1);
    setLeadId(null);
    setContactCaptured(false);
    setErrors({});
    setDisqualified(null);
    setSubmitted(false);
  }

  async function submit() {
    if (!validate(3)) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const leadEventId = metaEventId("lead", leadId ?? undefined);
      const payload = isNurturePath()
        ? {
            leadId: leadId ?? undefined,
            ...form,
            phone: normalizeUKPhone(form.phone),
            willOccupy: false,
            hasEverOccupied: false,
            propertyType: "unspecified",
            propertyValue: form.loanAmount,
            propertyLocation: "Timeline over 3 months",
            termMonths: 12,
            hasExistingMortgage: false,
            consent: true,
            source: "facebook_lp",
            adAngle: angle,
            ...tracking,
            ...metaTrackingPayload(leadEventId),
          }
        : {
            leadId: leadId ?? undefined,
            ...form,
            phone: normalizeUKPhone(form.phone),
            willOccupy: form.willOccupy ?? false,
            hasEverOccupied: form.hasEverOccupied ?? false,
            termMonths: 12,
            hasExistingMortgage: false,
            consent: true,
            source: "facebook_lp",
            adAngle: angle,
            ...tracking,
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
          clearFormStorage();
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
          clearFormStorage();
          setDisqualified(data);
          return;
        }
        if (data.errors) {
          setErrors(data.errors);
          return;
        }
        throw new Error();
      }
      trackMetaEvent(
        "Lead",
        {
          content_name: "Property Finance Enquiry",
          value: form.loanAmount,
          currency: "GBP",
        },
        { eventId: leadEventId },
      );
      clearFormStorage();
      setResumedSession(false);
      setSubmitted(true);
      scrollToForm("start");
    } catch {
      setErrors({ submit: "Something went wrong — please call 020 7177 4141" });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  if (disqualified) {
    if (disqualified.nurtureEnrolled) {
      return (
        <NurtureEnrolledScreen
          result={disqualified}
          email={form.email}
          onReset={resetForm}
        />
      );
    }
    return <DisqualifiedScreen result={disqualified} onReset={resetForm} />;
  }

  if (submitted) {
    return (
      <QualifiedThankYouScreen
        firstName={form.firstName}
        loanAmount={form.loanAmount ?? 0}
        loanPurpose={form.loanPurpose}
        timeframe={form.timeframe}
        propertyType={form.propertyType}
        propertyLocation={form.propertyLocation}
        leadId={leadId ?? undefined}
      />
    );
  }

  const step1Ready =
    Boolean(form.loanPurpose) &&
    Boolean(form.loanAmount && form.loanAmount >= 50000) &&
    Boolean(form.timeframe);

  return (
    <div
      id="quote-form"
      className="rounded-2xl border-2 border-gold/30 bg-white shadow-2xl shadow-navy/10"
    >
      <div className="rounded-t-2xl bg-navy px-4 py-2.5 text-white sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold sm:text-xs">
              Free — No obligation
            </p>
            <h2 className="font-display mt-0.5 text-sm font-medium capitalize sm:mt-1 sm:text-xl">
              <span className="md:hidden">Free Finance Enquiry</span>
              <span className="hidden md:inline">Start Your Free Enquiry</span>
            </h2>
          </div>
          <p className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-200 sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs sm:text-slate-400">
            {step}/3
          </p>
        </div>
        <div className="mt-2 flex gap-1 sm:mt-3 sm:gap-1.5">
          {FB_STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition sm:h-1.5",
                step >= s.id ? "bg-gold" : "bg-white/20",
              )}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-300 sm:hidden">
          {FB_STEPS[step - 1]?.title}
        </p>
        <div className="mt-4 hidden sm:block">
          <DanielExpertCard variant="compact" />
        </div>
        <ConversionTrustLine
          dark
          compact
          className="mt-3 hidden justify-center sm:mt-4 sm:flex sm:justify-center"
        />
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) handleContinueFromStep(step);
            else submit();
          }}
        >
        {resumedSession && step > 1 && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2.5 text-xs text-navy">
            <span className="font-medium">Welcome back — pick up where you left off</span>
            <button
              type="button"
              className="shrink-0 font-semibold text-gold-ink underline"
              onClick={resetForm}
            >
              Start over
            </button>
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <>
            <div className="sr-only" role="alert" aria-live="polite">
              {Object.values(errors).join(". ")}
            </div>
            <FormErrorBanner errors={errors} />
          </>
        )}
        <div className="mb-3 sm:mb-4">
          <p className="text-center text-xs text-slate-500">
            Step {step} of 3:{" "}
            <span className="font-medium text-navy">{FB_STEPS[step - 1]?.title}</span>
          </p>
          <p className="mt-1.5 text-center text-xs font-medium text-gold-ink sm:mt-2">
            {FB_STEP_BENEFITS[step]}
          </p>
        </div>

        <div ref={stepContentRef} className="scroll-mt-[4.5rem] sm:scroll-mt-20">
        {step > 1 && <StepSummary form={form} />}

        <FormStepPanel stepKey={step} loading={stepAnimating}>
        {step === 1 && (
          <div className="space-y-2.5 sm:space-y-5">
            <RegulatoryTrustStrip className="hidden sm:flex" />
            <StepFieldProgress
              items={[
                { label: "Purpose", done: Boolean(form.loanPurpose) },
                { label: "Amount", done: Boolean(form.loanAmount && form.loanAmount >= 50000) },
                { label: "Timeline", done: Boolean(form.timeframe) },
              ]}
            />
            <LoanPurposePicker
              id="fb-purpose"
              value={form.loanPurpose}
              onChange={(v) => update("loanPurpose", v)}
              error={errors.loanPurpose}
              showAll={showAllPurposes}
              onShowAllChange={setShowAllPurposes}
            />
            <MoneyQuickPicker
              id="fb-amount"
              label="What is the loan amount you need? (£)"
              value={form.loanAmount}
              quickOptions={QUICK_LOAN_AMOUNTS}
              customOpen={customAmountOpen}
              onCustomOpenChange={setCustomAmountOpen}
              onChange={(v) => update("loanAmount", v)}
              error={errors.loanAmount}
              expandLabel="Enter a different amount"
              placeholder="250,000"
            />
            <div>
              <Label htmlFor="fb-time" className="mb-1 sm:mb-1.5">When do you need it?</Label>
              <div className="mb-0">
                <OptionPills
                  options={QUICK_TIMEFRAMES.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  value={form.timeframe}
                  onChange={(v) => update("timeframe", v)}
                  activeId="fb-time"
                  columns={2}
                  className="gap-2"
                />
              </div>
              {isLongTimeframe(form.timeframe) && (
                <p className="mt-1.5 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11px] text-navy sm:mt-2 sm:px-3 sm:py-2 sm:text-xs">
                  Just researching? We&apos;ll send a free guide series — no pressure.
                </p>
              )}
              <FieldError message={errors.timeframe} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5 sm:space-y-5">
            <Step2ValueProposition />
            <StepFieldProgress
              items={[
                { label: "Name", done: Boolean(form.firstName.trim() && form.lastName.trim()) },
                { label: "Phone", done: isValidUKPhone(form.phone) },
                { label: "Email", done: isValidEmail(form.email) },
              ]}
            />
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="fb-first">First name</Label>
                <Input
                  id="fb-first"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  onBlur={() => validateField("firstName")}
                  placeholder="John"
                  autoComplete="given-name"
                />
                <FieldError message={errors.firstName} />
              </div>
              <div>
                <Label htmlFor="fb-last">Last name</Label>
                <Input
                  id="fb-last"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  onBlur={() => validateField("lastName")}
                  placeholder="Smith"
                  autoComplete="family-name"
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>
            <div>
              <Label htmlFor="fb-phone">Mobile number</Label>
              <Input
                id="fb-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", formatUKPhoneInput(e.target.value))}
                onBlur={() => validateField("phone")}
                placeholder="07XXX XXX XXX"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby="fb-phone-hint"
              />
              <FieldError message={errors.phone} />
              {!errors.phone && form.phone && ukPhoneDigitCount(form.phone) < 11 ? (
                <p id="fb-phone-hint" className="mt-1 text-xs text-slate-500">
                  UK mobile — {ukPhoneDigitCount(form.phone)}/11 digits
                </p>
              ) : (
                <p id="fb-phone-hint" className="mt-1 text-xs text-slate-500">
                  UK mobile — 11 digits starting with 07
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="fb-email">Email</Label>
              <Input
                id="fb-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value.trim())}
                onBlur={() => validateField("email")}
                placeholder="you@email.com"
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError message={errors.email} />
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-xs leading-snug text-slate-600 sm:leading-relaxed">
                I agree to be contacted about bridging finance. Business &amp; investment purposes
                only. See our{" "}
                <Link href="/privacy" className="font-medium text-gold-ink underline hover:text-gold-dark">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <SecureSaveNote />
            <FieldError message={errors.consent} />
            <FieldError message={errors.submit} />
          </div>
        )}

        {step === 3 && isNurturePath() && (
          <div className="space-y-3 sm:space-y-5">
            {(contactCaptured || leadId) && (
              <CaptureSavedBanner firstName={form.firstName} />
            )}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-slate-700 sm:p-5">
              <p className="font-semibold text-navy">Planning ahead?</p>
              <p className="mt-1 text-xs leading-relaxed sm:text-sm">
                We&apos;ll send a free email guide series — ready when you need property
                finance.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm sm:p-4">
              <dl className="space-y-2">
                <Row label="Name" value={`${form.firstName} ${form.lastName}`} />
                <Row label="Email" value={form.email} />
                <Row
                  label="Amount"
                  value={form.loanAmount ? formatCurrency(form.loanAmount) : ""}
                />
              </dl>
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1">
              <input
                type="checkbox"
                checked={form.nurtureConsent}
                onChange={(e) => update("nurtureConsent", e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-gold focus:ring-gold"
              />
              <span className="text-xs leading-snug text-slate-600 sm:leading-relaxed">
                I agree to receive bridging guides by email. Unsubscribe anytime.
              </span>
            </label>
            <FieldError message={errors.nurtureConsent} />
            <FieldError message={errors.submit} />
          </div>
        )}

        {step === 3 && !isNurturePath() && (
          <div className="space-y-2.5 sm:space-y-5">
            {(contactCaptured || leadId) && (
              <CaptureSavedBanner firstName={form.firstName} />
            )}
            <StepFieldProgress
              items={[
                {
                  label: "Eligibility",
                  done:
                    form.investmentOnly === true &&
                    form.willOccupy === false &&
                    form.hasEverOccupied === false,
                },
                { label: "Type", done: Boolean(form.propertyType) },
                {
                  label: "Value",
                  done: Boolean(form.propertyValue && form.propertyValue >= 50000),
                },
                { label: "Location", done: form.propertyLocation.trim().length >= 2 },
              ]}
            />
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:space-y-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy sm:text-xs">
                Investment &amp; business purposes only
              </p>
              <YesNoField
                id="fb-investment-only"
                label="Is this for investment or business purposes only?"
                hint="We only arrange unregulated bridging finance — not primary residences."
                value={form.investmentOnly}
                onChange={(val) => handleScreeningAnswer("investmentOnly", val)}
                error={errors.investmentOnly}
              />
              <YesNoField
                id="fb-will-occupy"
                label={
                  <>
                    <span className="sm:hidden">Will you live in this property?</span>
                    <span className="hidden sm:inline">
                      Do you intend to live in this property (now or in the future)?
                    </span>
                  </>
                }
                value={form.willOccupy}
                onChange={(val) => handleScreeningAnswer("willOccupy", val)}
                error={errors.willOccupy}
              />
              <YesNoField
                id="fb-ever-occupied"
                label={
                  <>
                    <span className="sm:hidden">Ever lived in this property?</span>
                    <span className="hidden sm:inline">
                      Have you or a family member ever lived in this property?
                    </span>
                  </>
                }
                value={form.hasEverOccupied}
                onChange={(val) => handleScreeningAnswer("hasEverOccupied", val)}
                error={errors.hasEverOccupied}
              />
            </div>
            <div>
              <Label htmlFor="fb-ptype" className="mb-1 sm:mb-1.5">
                Property type
              </Label>
              <OptionPills
                options={QUICK_PROPERTY_TYPES.map((p) => ({
                  value: p.value,
                  label: p.label,
                  title: p.title,
                }))}
                value={form.propertyType}
                onChange={(v) => update("propertyType", v)}
                activeId="fb-ptype"
                columns={2}
                className="gap-2"
              />
              <FieldError message={errors.propertyType} />
            </div>
            <MoneyQuickPicker
              id="fb-pval"
              label="Property value (£)"
              value={form.propertyValue}
              quickOptions={QUICK_PROPERTY_VALUES}
              customOpen={customPropertyOpen}
              onCustomOpenChange={setCustomPropertyOpen}
              onChange={(v) => update("propertyValue", v)}
              error={errors.propertyValue}
              expandLabel="Enter a different property value"
              placeholder="350,000"
              matchValue={form.loanAmount}
              matchLabel="Same as finance amount"
            />
            <div>
              <Label htmlFor="fb-loc">Property location</Label>
              <Input
                id="fb-loc"
                value={form.propertyLocation}
                onChange={(e) => update("propertyLocation", e.target.value)}
                placeholder="e.g. London, Manchester"
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.propertyLocation)}
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Town or city is enough — postcode optional
              </p>
              <FieldError message={errors.propertyLocation} />
            </div>
            <FieldError message={errors.submit} />
          </div>
        )}
        </FormStepPanel>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-4">
        <StepCtaHint>{STEP_CTA_HINTS[step]}</StepCtaHint>
        <FormTrustMicro />
        <div className="mt-2 flex items-stretch gap-2 sm:mt-3 sm:items-center sm:justify-between sm:gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[52px] shrink-0 px-3 sm:min-h-0"
              onClick={() => advanceStep(step - 1)}
            >
              <ChevronLeft className="mr-0.5 h-4 w-4" />
              <span className="hidden min-[380px]:inline">Back</span>
            </Button>
          ) : (
            <div className="hidden w-12 sm:block" />
          )}
          {step < 3 ? (
            <Button
              type="submit"
              size="lg"
              className={cn(
                "min-h-[52px] flex-1 text-base font-semibold shadow-md sm:min-h-0 sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm",
                step === 1 && step1Ready && "ring-2 ring-gold/50",
              )}
              disabled={submitting}
              aria-busy={submitting && step === 2}
            >
              {submitting && step === 2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving your details...
                </>
              ) : (
                <>
                  <span className="sm:hidden">
                    {step === 1 ? "Continue →" : "Save & continue →"}
                  </span>
                  <span className="hidden sm:inline">
                    {step === 1 ? "Continue — Your Details" : "Save My Details — Last Step"}
                  </span>
                  <ChevronRight className="ml-1 hidden h-4 w-4 sm:inline" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="min-h-[52px] flex-1 text-base font-semibold shadow-md sm:min-h-0 sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : isNurturePath() ? (
                <>
                  <span className="sm:hidden">Send my guides →</span>
                  <span className="hidden sm:inline">Send Me the Guide Series →</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Get my free quote →</span>
                  <span className="hidden sm:inline">Get My Free Quote →</span>
                </>
              )}
            </Button>
          )}
        </div>
        </div>
        </form>

        <div className="mt-4 hidden items-center justify-center gap-6 border-t border-slate-100 py-4 text-xs text-slate-600 md:flex">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Secure
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" /> No credit check
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> 2hr response
          </span>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-4">
          <GoogleRatingBadge variant="compact" className="hidden justify-center md:flex" href="#reviews" />
        </div>
      </div>
    </div>
  );
}

function StepSummary({ form }: { form: FormState }) {
  const purpose = LOAN_PURPOSES.find((p) => p.value === form.loanPurpose)?.label;
  const amount = form.loanAmount ? formatCurrency(form.loanAmount) : null;
  const timeframe = form.timeframe ? timeframeShortLabel(form.timeframe) : null;

  if (!amount && !purpose) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {amount && (
        <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy">
          {amount}
        </span>
      )}
      {purpose && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {purpose}
        </span>
      )}
      {timeframe && (
        <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-navy">
          {timeframe}
        </span>
      )}
    </div>
  );
}

function FormTrustMicro() {
  return (
    <div className="mt-3 flex items-center justify-center gap-2.5 text-[9px] text-slate-600 sm:mt-5 md:hidden">
      <span className="flex items-center gap-0.5">
        <Lock className="h-2.5 w-2.5 shrink-0" /> Secure
      </span>
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-0.5">
        <Shield className="h-2.5 w-2.5 shrink-0" /> No credit check
      </span>
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-0.5">
        <Clock className="h-2.5 w-2.5 shrink-0" /> 2hr response
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-navy">{value || "—"}</dd>
    </div>
  );
}
