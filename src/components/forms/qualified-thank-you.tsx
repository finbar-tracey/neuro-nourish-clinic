"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Calendar,
  Clock,
  Phone,
  Shield,
  Sparkles,
  Users,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { trackMetaEvent } from "@/lib/tracking";
import { metaEventId, metaTrackingPayload } from "@/lib/meta-tracking";
import { cn, formatCurrency } from "@/lib/utils";
import { LOAN_PURPOSES, PROPERTY_TYPES } from "@/lib/validations";
import { timeframeShortLabel } from "@/lib/timeframes";
import { bookPriorityCall, logBookingIntent } from "@/lib/booking";
import { formatDisplayTime, getTodayPrioritySlots } from "@/lib/priority-slots";
import { publicPartnerDisplayName } from "@/lib/vertical-config";

const DANIEL_PHONE = "020 7177 4141";
const DANIEL_PHONE_TEL = "02071774141";

export type QualifiedThankYouProps = {
  firstName: string;
  loanAmount: number;
  loanPurpose: string;
  timeframe: string;
  propertyType: string;
  propertyLocation?: string;
  leadId?: string;
  variant?: "bridging" | "healthcare";
  displayValues?: {
    purpose?: string;
    timeline?: string;
    property?: string;
  };
};

type BookingState = "idle" | "loading" | "confirmed" | "error";

function label(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "100% Independent",
    desc: "We work for you, not the lenders",
  },
  {
    icon: Sparkles,
    title: "No Obligation",
    desc: "Free consultation with no commitment",
  },
  {
    icon: Users,
    title: "200+ Lenders",
    desc: "Exclusive rates and specialist products",
  },
  {
    icon: Zap,
    title: "Fast & Flexible",
    desc: "Funding in as little as 48 hours",
  },
] as const;

const NEXT_STEPS = [
  { num: 1, title: "Enquiry received", detail: "Daniel is reviewing your details" },
  { num: 2, title: "Book your priority call", detail: "Pick a time below — takes 10 seconds" },
  { num: 3, title: "Consultation with Daniel", detail: "30-min call about your options" },
  { num: 4, title: "Decision in principle", detail: "Clear next steps from our panel" },
  { num: 5, title: "Funding arranged", detail: "As fast as 48 hours when ready" },
] as const;

function ThankYouBrokerStrip() {
  return (
    <div className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-left">
      <Image
        src="/daniel-mehrnia.webp"
        alt="Daniel Mehrnia"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-gold/30"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy">Daniel Mehrnia</p>
        <p className="text-xs text-slate-500">Partner · Specialist Bridging Loans Broker</p>
      </div>
    </div>
  );
}

function stepStatus(index: number, bookingConfirmed: boolean) {
  if (bookingConfirmed) {
    if (index <= 1) return "complete";
    if (index === 2) return "current";
    return "upcoming";
  }
  if (index === 0) return "complete";
  if (index === 1) return "current";
  return "upcoming";
}

function ProcessTimeline({ bookingConfirmed }: { bookingConfirmed: boolean }) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-5 sm:p-6">
      <p className="mb-5 text-base font-semibold text-navy">What happens next</p>

      {/* Vertical — narrow containers & mobile */}
      <ol className="space-y-0 @md:hidden">
        {NEXT_STEPS.map((step, i) => {
          const status = stepStatus(i, bookingConfirmed);
          return (
            <li key={step.num} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    status === "complete" && "bg-gold text-white",
                    status === "current" && "bg-gold text-white ring-4 ring-gold/20",
                    status === "upcoming" && "bg-slate-100 text-slate-500",
                  )}
                >
                  {status === "complete" ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  ) : (
                    step.num
                  )}
                </span>
                {i < NEXT_STEPS.length - 1 && (
                  <span
                    className={cn(
                      "my-1 min-h-[2rem] w-0.5 flex-1",
                      status === "complete" ? "bg-gold/40" : "bg-slate-200",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <div className={cn("min-w-0 flex-1", i < NEXT_STEPS.length - 1 && "pb-5")}>
                <p className="pt-1.5 text-sm font-semibold leading-snug text-navy">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Horizontal — wide container only */}
      <ol className="hidden @md:grid @md:grid-cols-5 @md:gap-2">
        {NEXT_STEPS.map((step, i) => {
          const status = stepStatus(i, bookingConfirmed);
          const isLast = i === NEXT_STEPS.length - 1;
          return (
            <li key={step.num} className="relative flex min-w-0 flex-col items-center text-center">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[calc(50%+1.25rem)] top-5 z-0 h-0.5 w-[calc(100%-2.5rem)]",
                    status === "complete" ? "bg-gold/50" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                  status === "complete" && "bg-gold text-white",
                  status === "current" && "bg-gold text-white ring-4 ring-gold/20",
                  status === "upcoming" && "bg-slate-100 text-slate-500",
                )}
              >
                {status === "complete" ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  step.num
                )}
              </span>
              <p className="mt-3 text-balance px-0.5 text-xs font-semibold leading-snug text-navy">
                {step.title}
              </p>
              <p className="mt-1 text-balance px-0.5 text-[11px] leading-snug text-slate-500">
                {step.detail}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SummaryCard({
  loanAmount,
  purpose,
  timeline,
  property,
  location,
}: {
  loanAmount: string;
  purpose: string;
  timeline: string;
  property: string;
  location?: string;
}) {
  const rows = [
    { label: "Loan amount", value: loanAmount },
    { label: "Purpose", value: purpose },
    { label: "Timeline", value: timeline },
    { label: "Property type", value: property },
    ...(location && location.trim().length >= 2
      ? [{ label: "Location", value: location.trim() }]
      : []),
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Your enquiry
      </p>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,7rem)_1fr] items-start gap-x-3 gap-y-0.5 sm:grid-cols-[auto_1fr]"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="break-words text-right text-sm font-semibold leading-snug text-navy sm:text-left">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 grid gap-2 border-t border-slate-200/80 pt-4 min-[400px]:grid-cols-2">
        {[
          "200+ specialist lenders",
          "From £50,000+",
          "Auction finance specialists",
          "Specialist bridging broker",
        ].map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-xs leading-snug text-slate-600 sm:text-sm"
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotPicker({
  slots,
  selectedId,
  onSelect,
}: {
  slots: ReturnType<typeof getTodayPrioritySlots>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = slots.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index < last ? index + 1 : 0;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index > 0 ? index - 1 : last;
    if (next !== index) {
      event.preventDefault();
      onSelect(slots[next].id);
      document.getElementById(`priority-slot-${slots[next].id}`)?.focus();
    }
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
      role="radiogroup"
      aria-label="Priority consultation time"
    >
      {slots.map((slot, index) => {
        const selected = slot.id === selectedId;
        return (
          <button
            key={slot.id}
            id={`priority-slot-${slot.id}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={slot.label}
            onClick={() => onSelect(slot.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "relative flex min-h-[104px] w-full flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              selected
                ? "border-gold bg-gold/15 shadow-md ring-2 ring-gold/30"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]",
            )}
          >
            {index === 0 && (
              <span className="mb-1.5 rounded-md bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Soonest
              </span>
            )}
            <span
              className={cn(
                "mb-2 flex h-5 w-5 items-center justify-center rounded-full border-2",
                selected ? "border-gold bg-gold" : "border-slate-300 bg-white",
              )}
              aria-hidden
            >
              {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {slot.dayLabel}
            </span>
            <span className="text-base font-bold leading-tight text-navy">{slot.time}</span>
            <span className="text-[11px] font-medium text-slate-500">{slot.period}</span>
          </button>
        );
      })}
    </div>
  );
}

function BookingConfirmedCard({
  displayTime,
  dayLabel,
  teamsLink,
}: {
  displayTime: string;
  dayLabel: string;
  teamsLink?: string | null;
}) {
  const when =
    dayLabel === "Today"
      ? `today at ${displayTime}`
      : `${dayLabel.toLowerCase()} at ${displayTime}`;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="font-display text-xl font-medium text-navy sm:text-2xl">
        Your priority call is confirmed
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-700 sm:text-base">
        Daniel will call you <strong className="font-semibold text-navy">{when}</strong>.
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Confirmation sent by SMS and email
        {teamsLink ? " — open the Teams link in your email to join the video call." : "."}
      </p>
      {teamsLink && (
        <a
          href={teamsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          Join Teams meeting
        </a>
      )}
    </div>
  );
}

export function QualifiedThankYouScreen({
  firstName,
  loanAmount,
  loanPurpose,
  timeframe,
  propertyType,
  propertyLocation,
  leadId,
  variant = "bridging",
  displayValues,
}: QualifiedThankYouProps) {
  const isHealthcareVariant = variant === "healthcare";
  const partnerName = publicPartnerDisplayName();
  const slots = useMemo(() => getTodayPrioritySlots(), []);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingState, setBookingState] = useState<BookingState>("idle");
  const [confirmedTime, setConfirmedTime] = useState("");
  const [confirmedDayLabel, setConfirmedDayLabel] = useState("Today");
  const [teamsLink, setTeamsLink] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const purpose = displayValues?.purpose ?? label(LOAN_PURPOSES, loanPurpose);
  const property = displayValues?.property ?? label(PROPERTY_TYPES, propertyType);
  const timeline = displayValues?.timeline ?? timeframeShortLabel(timeframe);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const slotsLeft = slots.length;
  const slotsDayLabel = slots[0]?.dayLabel ?? "Today";

  useEffect(() => {
    trackMetaEvent("ViewContent", { content_name: "Qualified Thank You" });
  }, []);

  useEffect(() => {
    if (slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slots[0].id);
    }
  }, [slots, selectedSlotId]);

  useEffect(() => {
    if (bookingState === "confirmed") {
      bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [bookingState]);

  async function handleReserve() {
    if (!selectedSlot) {
      setSlotError("Please choose a time first.");
      return;
    }

    if (!leadId) {
      setBookingError(
        isHealthcareVariant
          ? "We couldn't reserve that slot. Please try again or wait for a call from the clinic."
          : `We couldn't reserve that slot. Please call Daniel now on ${DANIEL_PHONE}.`,
      );
      setBookingState("error");
      return;
    }

    setSlotError(null);
    setBookingError(null);
    setBookingState("loading");

    const scheduleEventId = metaEventId("schedule", leadId);
    trackMetaEvent(
      "Schedule",
      {
        content_name: "Priority Consultation",
        value: loanAmount,
        currency: "GBP",
      },
      { eventId: scheduleEventId },
    );

    const result = await bookPriorityCall(leadId, selectedSlot.id, {
      ...metaTrackingPayload(scheduleEventId),
      landingPageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });

    if (!result.ok) {
      const message =
        result.code === "SLOT_TAKEN"
          ? `That slot was just taken — please choose another time.`
          : result.code === "CALENDAR_BUSY"
            ? isHealthcareVariant
              ? `That time is no longer available — please pick another slot.`
              : `Daniel isn't available at that time — please pick another slot.`
            : isHealthcareVariant
              ? `We couldn't reserve that slot. Please try again.`
              : `We couldn't reserve that slot. Please try again or call Daniel on ${DANIEL_PHONE}.`;
      setBookingError(message);
      setBookingState("error");
      return;
    }

    setConfirmedTime(result.displayTime ?? formatDisplayTime(selectedSlot));
    setConfirmedDayLabel(selectedSlot.dayLabel);
    setTeamsLink(result.teamsLink ?? null);
    setBookingState("confirmed");
  }

  function handleSlotSelect(id: string) {
    const slot = slots.find((s) => s.id === id);
    setSelectedSlotId(id);
    setSlotError(null);
    setBookingError(null);
    if (bookingState === "error") setBookingState("idle");
    if (leadId && slot) {
      void logBookingIntent(leadId, slot.label);
    }
  }

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(DANIEL_PHONE);
      setPhoneCopied(true);
      window.setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  function handlePhoneClick() {
    trackMetaEvent("Contact", { content_name: "Thank You Urgent Call" });
  }

  const reserveLabel = selectedSlot
    ? isHealthcareVariant
      ? `Reserve consultation · ${formatDisplayTime(selectedSlot)}`
      : `Book priority call · ${formatDisplayTime(selectedSlot)}`
    : "Select a time to continue";

  const headerTitle =
    bookingState === "confirmed"
      ? isHealthcareVariant
        ? `Consultation confirmed, ${firstName}!`
        : `Call confirmed, ${firstName}!`
      : `You're all set, ${firstName}!`;

  const headerSubtitle =
    bookingState === "confirmed"
      ? isHealthcareVariant
        ? "Your consultation is booked. Check your phone and email for confirmation."
        : "Daniel has your consultation in his calendar. Check your phone and email for details."
      : isHealthcareVariant
        ? "Choose a consultation time below — or we'll call you within 15 minutes."
        : "Your enquiry is with Daniel. Book a priority call below — or he'll reach out within 2 hours.";

  return (
    <div
      id="quote-form"
      className="@container overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40"
    >
      <div
        className="border-b border-slate-100 px-4 py-7 text-center sm:px-6 sm:py-9"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} aria-hidden />
        </div>
        <h2 className="font-display text-2xl font-medium leading-tight text-navy sm:text-3xl">
          {headerTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          {headerSubtitle}
        </p>
        {bookingState !== "confirmed" && (
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {!isHealthcareVariant && (
              <>
                <strong className="font-semibold text-navy">{formatCurrency(loanAmount)}</strong>{" "}
              </>
            )}
            {purpose} · {timeline}
          </p>
        )}
        {!isHealthcareVariant && <ThankYouBrokerStrip />}
        <GoogleRatingBadge variant="compact" className="mt-4 justify-center sm:mt-5" />
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-5">
          <div ref={bookingRef} className="w-full">
            {bookingState === "confirmed" ? (
              <BookingConfirmedCard
                displayTime={confirmedTime}
                dayLabel={confirmedDayLabel}
                teamsLink={teamsLink}
              />
            ) : (
              <div className="flex h-full flex-col rounded-2xl border-2 border-gold/25 bg-gradient-to-br from-gold/5 to-white p-4 shadow-lg shadow-gold/5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20">
                      <Calendar className="h-5 w-5 text-gold-ink" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-medium text-navy sm:text-xl">
                        {isHealthcareVariant ? "Book your consultation" : "Want to move faster?"}
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {isHealthcareVariant
                          ? `Choose a time for your free implant consultation at ${partnerName}.`
                          : "Book a priority call with Daniel today."}
                      </p>
                    </div>
                  </div>
                  {slotsLeft > 0 && (
                    <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-ink">
                      {slotsLeft} slot{slotsLeft === 1 ? "" : "s"} left {slotsDayLabel.toLowerCase()}
                    </span>
                  )}
                </div>

                <p className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                  30-min consultation · {slotsDayLabel === "Today" ? "Available today" : "Next available tomorrow"}
                </p>

                {slots.length > 0 ? (
                  <>
                    <SlotPicker
                      slots={slots}
                      selectedId={selectedSlotId}
                      onSelect={handleSlotSelect}
                    />
                    {selectedSlot && (
                      <p className="mt-3 text-center text-sm text-slate-600">
                        Selected:{" "}
                        <strong className="font-semibold text-navy">{selectedSlot.label}</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    No slots left today — call Daniel on{" "}
                    <a href={`tel:${DANIEL_PHONE_TEL}`} className="font-semibold text-navy underline">
                      {DANIEL_PHONE}
                    </a>
                  </p>
                )}

                {slotError && (
                  <p
                    className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900"
                    role="alert"
                  >
                    {slotError}
                  </p>
                )}

                {bookingState === "error" && bookingError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium leading-relaxed text-red-900">{bookingError}</p>
                    <a
                      href={`tel:${DANIEL_PHONE_TEL}`}
                      onClick={handlePhoneClick}
                      className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-light"
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden />
                      Call Daniel · {DANIEL_PHONE}
                    </a>
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={handleReserve}
                    disabled={bookingState === "loading" || !selectedSlot}
                    className={cn(
                      "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold transition active:scale-[0.99]",
                      selectedSlot
                        ? "bg-gold text-navy shadow-lg shadow-gold/20 hover:bg-gold-light"
                        : "cursor-not-allowed bg-slate-100 text-slate-400",
                      bookingState === "loading" && "opacity-80",
                    )}
                  >
                    {bookingState === "loading" ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Reserving your call…
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5 shrink-0" aria-hidden />
                        {reserveLabel}
                      </>
                    )}
                  </button>
                  {!selectedSlot && slots.length > 0 && (
                    <p className="mt-2 text-center text-xs text-slate-500">
                      Choose a different time above if needed
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full">
            <SummaryCard
              loanAmount={formatCurrency(loanAmount)}
              purpose={purpose}
              timeline={timeline}
              property={property}
              location={propertyLocation}
            />
          </div>
        </div>

        {bookingState !== "confirmed" && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/25">
                <Phone className="h-5 w-5 text-gold-ink" aria-hidden />
              </div>
              <div>
                <p className="text-base font-semibold text-navy">Need urgent funding?</p>
                <p className="mt-0.5 text-sm text-slate-600">Speak to Daniel straight away</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={`tel:${DANIEL_PHONE_TEL}`}
                onClick={handlePhoneClick}
                className="inline-flex min-h-[52px] w-full flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gold/40 bg-white px-4 text-sm font-semibold text-navy transition hover:border-gold/60 hover:bg-gold/5 active:scale-[0.99]"
              >
                <Phone className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                <span className="truncate">Call {DANIEL_PHONE}</span>
              </a>
              <button
                type="button"
                onClick={copyPhone}
                className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:scale-[0.99] sm:w-36"
              >
                {phoneCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 @md:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center @md:text-left"
            >
              <Icon className="mx-auto mb-2 h-5 w-5 text-navy @md:mx-0" aria-hidden />
              <p className="text-sm font-semibold leading-snug text-navy">{title}</p>
              <p className="mt-1 text-xs leading-snug text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <ProcessTimeline bookingConfirmed={bookingState === "confirmed"} />
      </div>
    </div>
  );
}
