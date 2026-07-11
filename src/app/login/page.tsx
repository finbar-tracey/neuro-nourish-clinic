"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { PageContainer } from "@/components/neuronourish/content";

function PatientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionNotice = useMemo(() => {
    const code = searchParams.get("error");
    if (code === "session_expired") {
      return "Your secure session expired. Please sign in again.";
    }
    if (code === "profile_not_found") {
      return "We could not locate your care profile. Please contact support.";
    }
    return null;
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFormLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as {
        error?: string;
        patientProfile?: { id: string };
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Invalid credentials.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer width="md" className="py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-mist bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
            <ShieldCheck className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <h1 className="font-display text-3xl text-deep-slate">Client Portal</h1>
          <p className="mt-2 text-sm text-ink/65">
            Access your personalised brain health programme dashboard
          </p>
        </div>

        <form onSubmit={handleFormLogin} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-blue">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" aria-hidden />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-mist bg-ivory py-3 pl-10 pr-4 text-sm text-ink transition focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-blue">
              Secure password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" aria-hidden />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-mist bg-ivory py-3 pl-10 pr-4 text-sm text-ink transition focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {sessionNotice ? (
            <p className="rounded border border-gold/20 bg-gold/5 p-2 text-center text-xs font-medium text-deep-slate">
              {sessionNotice}
            </p>
          ) : null}

          {error ? (
            <p className="rounded border border-red-500/20 bg-red-500/5 p-2 text-center text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gold bg-deep-slate py-3 text-[13px] font-medium text-white transition hover:bg-deep-slate/90 disabled:opacity-50"
          >
            <span>{isLoading ? "Verifying identity…" : "Sign in to dashboard"}</span>
            <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
          </button>
        </form>

        <p className="mt-6 border-t border-linen pt-4 text-center text-xs leading-relaxed text-ink/60">
          First time accessing your protocol? Use the personalized activation link from your
          assessment confirmation email, or{" "}
          <Link href="/onboarding" className="nn-text-link">
            complete onboarding
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}

export default function PatientLoginPage() {
  return (
    <NeuroNourishShell>
      <Suspense fallback={null}>
        <PatientLoginForm />
      </Suspense>
    </NeuroNourishShell>
  );
}
