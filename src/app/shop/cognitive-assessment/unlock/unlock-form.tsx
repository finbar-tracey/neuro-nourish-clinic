"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function CnsUnlockForm() {
  const search = useSearchParams();
  const router = useRouter();
  const leadId = search.get("leadId") ?? "";
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMessage(null);
    if (!leadId) {
      setError("Missing purchase reference. Open the link from your confirmation email.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/cns/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, dateOfBirth: dob }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        status?: string;
        dobSaved?: boolean;
      };
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Could not unlock assessment");
        if (data.dobSaved) {
          setOkMessage("Date of birth was saved. Our care team will follow up about your test link.");
        }
        return;
      }
      setOkMessage(data.message ?? "Unlocked — check your email.");
      if (data.status === "awaiting_report") {
        router.push(
          `/shop/success?product=cognitive-assessment&leadId=${encodeURIComponent(leadId)}`,
        );
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-md space-y-5 text-left">
      <div>
        <label htmlFor="dob" className="block text-sm font-medium text-ink">
          Date of birth
        </label>
        <p className="mt-1 text-xs text-ink/60">
          Used only for age-normed cognitive scoring. Not shared publicly.
        </p>
        <input
          id="dob"
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mt-2 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {okMessage ? <p className="text-sm text-slate-blue">{okMessage}</p> : null}

      <button
        type="submit"
        disabled={pending || !leadId}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Unlocking…" : "Unlock my assessment"}
      </button>
    </form>
  );
}
