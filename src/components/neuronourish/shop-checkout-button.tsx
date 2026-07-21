"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ShopProduct } from "@/lib/neuronourish-shop";
import { fireMetaInitiateCheckoutEvent } from "@/lib/meta-tracking";

export function ShopCheckoutButton({
  product,
  className = "",
}: {
  product: ShopProduct;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("leadId") ?? "";
  const requireDetails = product.funnelStage === "assessment_purchased";

  const [leadId, setLeadId] = useState(leadIdParam);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobOnFile, setDobOnFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLeadId(leadIdParam);
  }, [leadIdParam]);

  useEffect(() => {
    if (!requireDetails || !leadIdParam) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/shop/checkout-prefill?leadId=${encodeURIComponent(leadIdParam)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
          hasDateOfBirth?: boolean;
        };
        if (cancelled) return;
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.email) setEmail(data.email);
        if (data.phone && data.phone !== "not_provided") setPhone(data.phone);
        if (data.hasDateOfBirth) setDobOnFile(true);
      } catch {
        /* ignore prefill failures */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadIdParam, requireDetails]);

  async function checkout(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");

    if (requireDetails) {
      const needDob = !dobOnFile && !dateOfBirth;
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || needDob) {
        setError("Please enter your name, email, phone, and date of birth.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.slug,
          leadId: leadId || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        }),
      });
      const json = (await res.json()) as {
        url?: string;
        leadId?: string;
        error?: string;
        fallbackUrl?: string;
      };

      if (json.leadId) {
        setLeadId(json.leadId);
        fireMetaInitiateCheckoutEvent(
          product.slug,
          product.amountCents / 100,
          json.leadId,
        );
      } else if (leadId) {
        fireMetaInitiateCheckoutEvent(product.slug, product.amountCents / 100, leadId);
      }

      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setError(json.error ?? "Checkout unavailable.");
      if (json.fallbackUrl) {
        window.setTimeout(() => {
          window.location.href = json.fallbackUrl!;
        }, 1800);
      }
    } catch {
      setError("Checkout unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!requireDetails) {
    return (
      <div className={`flex w-full flex-col items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90 disabled:opacity-50 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : product.ctaLabel}
        </button>
        <span className="text-center text-xs text-ink/60">{product.ctaHint}</span>
        {error ? (
          <p className="mt-1 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void checkout(e)}
      className={`mx-auto w-full max-w-md space-y-4 text-left ${className}`}
    >
      <p className="text-center text-sm text-ink/70">
        Enter your details to continue — date of birth is used for age-normed CNS scoring.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">First name</span>
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Last name</span>
          <input
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-ink">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Phone</span>
        <input
          required
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-ink">Date of birth</span>
        {dobOnFile ? (
          <p className="mt-1.5 text-sm text-ink/70">
            On file — enter a new date only if you need to update it.
          </p>
        ) : null}
        <input
          required={!dobOnFile}
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink"
        />
        <span className="mt-1 block text-xs text-ink/55">
          Used only for CNS Vital Signs age norms. Not shared publicly.
        </span>
      </label>

      <div className="flex flex-col items-center gap-1.5 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-[13px] font-medium text-deep-slate transition hover:bg-gold/90 disabled:opacity-50 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : product.ctaLabel}
        </button>
        <span className="text-center text-xs text-ink/60">{product.ctaHint}</span>
      </div>
      {error ? (
        <p className="text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
