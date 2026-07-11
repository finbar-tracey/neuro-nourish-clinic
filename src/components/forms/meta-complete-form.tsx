"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
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
  MoneyQuickPicker,
  StepFieldProgress,
  StepCtaHint,
} from "@/components/forms/form-field-ui";
import { YesNoField } from "@/components/forms/yes-no-field";
import { LOAN_PURPOSES } from "@/lib/validations";
import { QUICK_PROPERTY_TYPES, QUICK_PROPERTY_VALUES } from "@/lib/ad-angles";
import { normalizeUKPhone } from "@/lib/form-validation";
import { isLongTimeframe, timeframeShortLabel } from "@/lib/timeframes";
import type { DisqualifyResult } from "@/lib/qualifications";
import { cn, formatCurrency } from "@/lib/utils";
import { ChevronLeft, Loader2, Lock, Shield } from "lucide-react";

export type MetaCompleteLead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanPurpose: string;
  loanAmount: number;
  timeframe: string;
};

type FormState = {
  propertyType: string;
  propertyLocation: string;
  propertyValue: number | undefined;
  willOccupy: boolean | null;
  hasEverOccupied: boolean | null;
  investmentOnly: boolean | null;
  nurtureConsent: boolean;
};

const initialForm: FormState = {
  propertyType: "",
  propertyLocation: "",
  propertyValue: undefined,
  willOccupy: null,
  hasEverOccupied: null,
  investmentOnly: null,
  nurtureConsent: false,
};

export function MetaCompleteForm({
  lead,
  completionToken,
}: {
  lead: MetaCompleteLead;
  completionToken: string;
}) {
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    propertyValue: lead.loanAmount,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [disqualified, setDisqualified] = useState<DisqualifyResult | null>(null);
  const [customPropertyOpen, setCustomPropertyOpen] = useState(false);
  const submittingRef = useRef(false);

  const nurturePath = isLongTimeframe(lead.timeframe);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (nurturePath) {
      if (!form.nurtureConsent) e.nurtureConsent = "Please agree to receive guides";
    } else {
      if (form.investmentOnly === null) e.investmentOnly = "Please select an option";
      if (form.willOccupy === null) e.willOccupy = "Please select an option";
      if (form.hasEverOccupied === null) e.hasEverOccupied = "Please select an option";
      if (!form.propertyType) e.propertyType = "Required";
      if (!form.propertyLocation.trim()) e.propertyLocation = "Required";
      if (!form.propertyValue || form.propertyValue < 50000) e.propertyValue = "Minimum £50,000";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function disqualifyFromScreening(willOccupy: boolean, hasEverOccupied: boolean) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          completionToken,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: normalizeUKPhone(lead.phone),
          loanPurpose: lead.loanPurpose,
          loanAmount: lead.loanAmount,
          timeframe: lead.timeframe,
          propertyType: form.propertyType || "unspecified",
          propertyValue: form.propertyValue ?? lead.loanAmount,
          propertyLocation: form.propertyLocation.trim() || "Not provided",
          willOccupy,
          hasEverOccupied,
          termMonths: 12,
          hasExistingMortgage: false,
          consent: true,
          source: "meta_instant_form",
        }),
      });
      const data = await res.json();
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

  async function submit() {
    if (!validate()) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const payload = nurturePath
        ? {
            leadId: lead.id,
            completionToken,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: normalizeUKPhone(lead.phone),
            loanPurpose: lead.loanPurpose,
            loanAmount: lead.loanAmount,
            timeframe: lead.timeframe,
            willOccupy: false,
            hasEverOccupied: false,
            propertyType: "unspecified",
            propertyValue: lead.loanAmount,
            propertyLocation: "Timeline over 3 months",
            termMonths: 12,
            hasExistingMortgage: false,
            consent: true,
            source: "meta_instant_form",
          }
        : {
            leadId: lead.id,
            completionToken,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: normalizeUKPhone(lead.phone),
            loanPurpose: lead.loanPurpose,
            loanAmount: lead.loanAmount,
            timeframe: lead.timeframe,
            propertyType: form.propertyType,
            propertyLocation: form.propertyLocation.trim(),
            propertyValue: form.propertyValue,
            willOccupy: form.willOccupy ?? false,
            hasEverOccupied: form.hasEverOccupied ?? false,
            termMonths: 12,
            hasExistingMortgage: false,
            consent: true,
            source: "meta_instant_form",
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
        throw new Error();
      }

      setSubmitted(true);
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
          email={lead.email}
          onReset={() => window.location.reload()}
        />
      );
    }
    return <DisqualifiedScreen result={disqualified} onReset={() => window.location.reload()} />;
  }

  if (submitted) {
    return (
      <QualifiedThankYouScreen
        firstName={lead.firstName}
        loanAmount={lead.loanAmount}
        loanPurpose={lead.loanPurpose}
        timeframe={lead.timeframe}
        propertyType={form.propertyType}
        propertyLocation={form.propertyLocation}
        leadId={lead.id}
      />
    );
  }

  const purposeLabel = LOAN_PURPOSES.find((p) => p.value === lead.loanPurpose)?.label;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border-2 border-gold/30 bg-white shadow-2xl shadow-navy/10">
      <div className="rounded-t-2xl bg-navy px-4 py-4 text-white sm:px-6 sm:py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gold sm:text-xs">
          Final step — ~2 minutes
        </p>
        <h1 className="font-display mt-1 text-lg font-medium sm:text-xl">
          Complete your eligibility check
        </h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <SummaryChip>{formatCurrency(lead.loanAmount)}</SummaryChip>
          {purposeLabel && <SummaryChip muted>{purposeLabel}</SummaryChip>}
          {lead.timeframe && (
            <SummaryChip accent>{timeframeShortLabel(lead.timeframe)}</SummaryChip>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
        <CaptureSavedBanner firstName={lead.firstName} />

        {Object.keys(errors).length > 0 && <FormErrorBanner errors={errors} />}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <FormStepPanel stepKey={3} loading={false}>
            {nurturePath ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-navy">Planning ahead?</p>
                  <p className="mt-1 text-xs leading-relaxed sm:text-sm">
                    We&apos;ll send a free email guide series — ready when you need property finance.
                  </p>
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
              </div>
            ) : (
              <div className="space-y-4">
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
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-navy sm:text-xs">
                    Investment &amp; business purposes only
                  </p>
                  <YesNoField
                    id="mc-investment-only"
                    label="Is this for investment or business purposes only?"
                    hint="We only arrange unregulated bridging finance — not primary residences."
                    value={form.investmentOnly}
                    onChange={(val) => handleScreeningAnswer("investmentOnly", val)}
                    error={errors.investmentOnly}
                  />
                  <YesNoField
                    id="mc-will-occupy"
                    label="Do you intend to live in this property (now or in the future)?"
                    value={form.willOccupy}
                    onChange={(val) => handleScreeningAnswer("willOccupy", val)}
                    error={errors.willOccupy}
                  />
                  <YesNoField
                    id="mc-ever-occupied"
                    label="Have you or a family member ever lived in this property?"
                    value={form.hasEverOccupied}
                    onChange={(val) => handleScreeningAnswer("hasEverOccupied", val)}
                    error={errors.hasEverOccupied}
                  />
                </div>
                <div>
                  <Label htmlFor="mc-ptype" className="mb-1.5">
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
                    activeId="mc-ptype"
                    columns={2}
                    className="gap-2"
                  />
                  <FieldError message={errors.propertyType} />
                </div>
                <MoneyQuickPicker
                  id="mc-pval"
                  label="Property value (£)"
                  value={form.propertyValue}
                  quickOptions={QUICK_PROPERTY_VALUES}
                  customOpen={customPropertyOpen}
                  onCustomOpenChange={setCustomPropertyOpen}
                  onChange={(v) => update("propertyValue", v)}
                  error={errors.propertyValue}
                  expandLabel="Enter a different property value"
                  placeholder="350,000"
                  matchValue={lead.loanAmount}
                  matchLabel="Same as finance amount"
                />
                <div>
                  <Label htmlFor="mc-loc">Property location</Label>
                  <Input
                    id="mc-loc"
                    value={form.propertyLocation}
                    onChange={(e) => update("propertyLocation", e.target.value)}
                    placeholder="e.g. London, Manchester"
                    autoComplete="address-level2"
                  />
                  <FieldError message={errors.propertyLocation} />
                </div>
              </div>
            )}
            <FieldError message={errors.submit} />
          </FormStepPanel>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <StepCtaHint>Free quote · No hard credit check · Business &amp; investment only</StepCtaHint>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="mt-3 min-h-[52px] w-full text-base font-semibold shadow-md sm:min-h-0 sm:text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : nurturePath ? (
                "Send my guides →"
              ) : (
                "Get my free quote →"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-100 pt-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Secure
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" /> No credit check
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryChip({
  children,
  muted,
  accent,
}: {
  children: React.ReactNode;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        accent && "bg-gold/20 text-navy",
        muted && "bg-white/10 font-medium text-slate-200",
        !accent && !muted && "bg-white/15 text-white",
      )}
    >
      {children}
    </span>
  );
}
