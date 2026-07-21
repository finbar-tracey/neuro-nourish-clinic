import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import {
  ArrowRight,
  Brain,
  Calendar,
  Clock,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { getActivePatientSession } from "@/lib/neuronourish-auth-session";
import { NN_PRICING } from "@/lib/neuronourish-funnel";

function concernLabel(concern: string | null) {
  if (!concern) return "General prevention";
  return concern.replace(/_/g, " ");
}

function stageLabel(stage: string) {
  return stage.replace(/_/g, " ");
}

export default async function ConsumerDashboardPortalPage() {
  const session = await getActivePatientSession();
  if (!session) {
    redirect("/login?error=session_expired");
  }

  const lead = await db.lead.findUnique({ where: { id: session.leadId } });
  if (!lead) {
    redirect("/login?error=profile_not_found");
  }

  const daysRemaining = lead.creditExpiryDate
    ? Math.max(0, differenceInDays(new Date(lead.creditExpiryDate), new Date()))
    : 0;

  const isEnrolledInFullProgram =
    lead.funnelStage === "programme_enrolled" ||
    lead.revenueEur >= NN_PRICING.programmeCents / 100;
  const isCreditActive = Boolean(lead.creditExpiryDate) && daysRemaining > 0;
  const focus = concernLabel(lead.primaryConcern);
  const patientName = `${lead.firstName} ${lead.lastName}`.trim() || session.name;

  const assessmentComplete = [
    "onboarding_completed",
    "assessment_completed",
    "programme_offered",
    "programme_enrolled",
  ].includes(lead.funnelStage ?? "");

  return (
    <div className="min-h-screen bg-ivory font-sans text-ink">
      <header className="no-print flex items-center justify-between border-b border-gold/30 bg-deep-slate px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-gold" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-wide text-white">
            NeuroNourish Client Portal
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-white/80">
          <span>
            Active patient: <strong className="text-white">{patientName}</strong>
          </span>
          <form action="/api/onboarding/logout" method="POST" className="inline">
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 font-sans text-gold hover:underline"
            >
              <LogOut className="h-3 w-3" aria-hidden />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex flex-col gap-4 border-b border-mist/80 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold text-deep-slate">
              Hello, {lead.firstName}
            </h1>
            <p className="text-sm text-ink/65">
              Focus parameter:{" "}
              <span className="font-medium capitalize text-slate-blue">{focus}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-gold/20 bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">
            <UserCheck className="h-4 w-4" aria-hidden />
            <span>Stage: {stageLabel(lead.funnelStage ?? "unknown")}</span>
          </div>
        </div>

        {!isEnrolledInFullProgram && isCreditActive && lead.creditExpiryDate ? (
          <div
            className={`flex flex-col items-start justify-between gap-6 rounded-2xl border p-6 transition-all md:flex-row md:items-center ${
              daysRemaining <= 7
                ? "border-red-500/20 bg-red-500/5"
                : "border-gold/20 bg-gold/5"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 rounded-xl p-3 ${daysRemaining <= 7 ? "bg-red-500/10" : "bg-gold/10"}`}
              >
                <Clock
                  className={`h-6 w-6 ${daysRemaining <= 7 ? "text-red-600" : "text-gold"}`}
                  aria-hidden
                />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-deep-slate">
                  Your programme upgrade balance is active
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-ink/70">
                  You have{" "}
                  <strong className={daysRemaining <= 7 ? "text-red-600" : "text-deep-slate"}>
                    {daysRemaining} days remaining
                  </strong>{" "}
                  to carry your initial {NN_PRICING.assessmentLabel} assessment fee directly into
                  your 12-month supervised care protocol. Your upgrade balance expires on{" "}
                  {format(new Date(lead.creditExpiryDate), "dd MMMM yyyy")}.
                </p>
              </div>
            </div>
            <Link
              href={`/programme?leadId=${encodeURIComponent(lead.id)}`}
              className="flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-gold bg-deep-slate px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-deep-slate/90 md:w-auto"
            >
              <span>Apply my €90 credit</span>
              <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-mist bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <Brain className="h-5 w-5" aria-hidden />
                <h3 className="font-display text-base font-semibold text-deep-slate">
                  1. Scientific evaluation
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-ink/65">
                Complete your standardized online cognitive test panel. This measures baseline
                processing speed, memory performance, and focus indicators before your protocol
                design begins.
              </p>
            </div>
            <div className="pt-2">
              {lead.assessmentPaidAt || assessmentComplete ? (
                <span className="block rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-center text-xs font-semibold text-emerald-700">
                  Testing token registered automatically
                </span>
              ) : (
                <Link
                  href={`/shop/cognitive-assessment?leadId=${encodeURIComponent(lead.id)}`}
                  className="block rounded border border-mist bg-ivory px-2 py-1 text-center text-xs font-semibold text-slate-blue hover:bg-linen/40"
                >
                  Start baseline assessment
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-mist bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <Calendar className="h-5 w-5" aria-hidden />
                <h3 className="font-display text-base font-semibold text-deep-slate">
                  2. Consultation review
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-ink/65">
                Schedule your complimentary 15-minute diagnostic evaluation review with our care
                team to synthesize your assessment metrics and walk through your biomarker needs.
              </p>
            </div>
            <Link
              href={`/discovery?leadId=${encodeURIComponent(lead.id)}`}
              className="block w-full rounded-lg border border-mist bg-ivory px-4 py-2 text-center text-xs font-semibold text-deep-slate transition hover:bg-deep-slate hover:text-white"
            >
              Schedule review call
            </Link>
          </div>

          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-mist bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <MessageSquare className="h-5 w-5" aria-hidden />
                <h3 className="font-display text-base font-semibold text-deep-slate">
                  3. Clinical mentorship
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-ink/65">
                Once enrolled in your full programme, your direct app connection opens. Your
                dedicated coach provides accountability, micro-habit feedback, and secure message
                updates.
              </p>
            </div>
            <div className="pt-2">
              {isEnrolledInFullProgram ? (
                <span className="block rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-center text-xs font-semibold text-emerald-700">
                  Coach messaging active
                </span>
              ) : (
                <span className="block rounded border border-mist bg-linen/30 px-2 py-1 text-center text-xs font-semibold text-ink/55">
                  Unlocks upon full programme enrollment
                </span>
              )}
            </div>
          </div>
        </div>

        {!lead.passwordHash ? (
          <p className="text-center text-sm text-ink/65">
            Complete your portal setup:{" "}
            <Link href={`/onboarding?leadId=${encodeURIComponent(lead.id)}`} className="nn-text-link">
              Finish onboarding wizard
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
