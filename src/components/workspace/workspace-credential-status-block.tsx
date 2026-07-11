"use client";

import { KeyRound, Lock, Unlock } from "lucide-react";
import { formatDate } from "@/lib/utils";

type CredentialLead = {
  id: string;
  email: string;
  credentialsProvisioned: boolean;
  funnelStage: string;
  updatedAt: string | Date;
};

export function WorkspaceCredentialStatusBlock({
  lead,
  onResetCredentials,
  resetting = false,
}: {
  lead: CredentialLead;
  onResetCredentials?: () => void | Promise<void>;
  resetting?: boolean;
}) {
  const isProvisioned = lead.credentialsProvisioned;
  const onboardingHref = `/onboarding?leadId=${encodeURIComponent(lead.id)}`;

  return (
    <div className="no-print my-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gold" aria-hidden />
          <h3 className="font-display text-lg font-semibold text-navy">Client portal</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            isProvisioned
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
              : "border-gold/20 bg-gold/10 text-gold"
          }`}
        >
          {isProvisioned ? "Password set" : "Not set up yet"}
        </span>
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 font-medium text-navy">
            {isProvisioned ? (
              <Lock className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Unlock className="h-4 w-4 text-gold" aria-hidden />
            )}
            <span>{isProvisioned ? "Portal access ready" : "Awaiting onboarding"}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {isProvisioned
              ? `Password set on ${formatDate(lead.updatedAt)}. Client can sign in with ${lead.email}.`
              : "After the €90 assessment, send the client their onboarding link so they can set a password and open the app."}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2">
          {!isProvisioned ? (
            <a
              href={onboardingHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-4 py-2 text-center text-xs font-semibold text-deep-slate transition hover:bg-gold/90"
            >
              Open onboarding link
            </a>
          ) : (
            <button
              type="button"
              disabled={resetting}
              onClick={() => {
                if (
                  !confirm(
                    "Reset this client's portal password? They will need to set a new one via onboarding.",
                  )
                ) {
                  return;
                }
                void onResetCredentials?.();
              }}
              className="min-h-[44px] rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {resetting ? "Resetting…" : "Reset portal password"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
