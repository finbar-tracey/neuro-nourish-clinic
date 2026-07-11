"use client";

export function PrintReferralCardButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-deep-slate hover:bg-gold/90"
    >
      Print card
    </button>
  );
}
