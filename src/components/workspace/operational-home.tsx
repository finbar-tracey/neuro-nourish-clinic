"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Calendar, Euro, Flame, Phone } from "lucide-react";
import { CaseCard } from "@/components/workspace/case-card";
import { useIsMobile } from "@/components/workspace/use-is-mobile";
import { useOperationalData } from "@/components/workspace/use-operational-data";
import { formatCurrency } from "@/lib/utils";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import { formatEur, formatEurAmount, nnHomeCopy } from "@/lib/neuronourish-workspace";
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceKpiCard,
  WorkspacePageHeader,
  WorkspaceRefreshButton,
  WorkspaceSkeletonCards,
} from "@/components/workspace/workspace-ui";

const QUICK_LINKS = [
  { href: "/workspace/inbox", label: "New Leads", icon: Flame, tone: "orange" as const },
  { href: "/workspace/callbacks", label: "Follow-Up", icon: Phone, tone: "violet" as const },
  { href: "/workspace/completions", label: "Completed", icon: Euro, tone: "green" as const },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function OperationalHome() {
  const { data, loading, error, reload } = useOperationalData();
  const isMobile = useIsMobile();
  const isNn = isNeuronourishVertical();
  const nnCopy = isNn ? nnHomeCopy() : null;

  const p = data?.pulse;
  const pr = data?.priorities;

  const callNow = pr?.uncontactedNew ?? [];
  const followUpActive = pr?.followUpDue ?? [];
  const displayCallNow = isMobile ? callNow.slice(0, 5) : callNow.slice(0, 10);
  const displayFollowUp = isMobile ? followUpActive.slice(0, 5) : followUpActive.slice(0, 10);

  const quickLinks = isNn
    ? [
        { href: "/workspace/inbox", label: "New enquiries", icon: Flame, tone: "orange" as const },
        { href: "/workspace/callbacks", label: "Follow-up", icon: Phone, tone: "violet" as const },
        { href: "/workspace/completions", label: "Enrolled", icon: Euro, tone: "green" as const },
      ]
    : QUICK_LINKS;

  const ownerName = nnCopy?.greeting ?? (isNn ? "Emer" : "Daniel");
  const homeDescription =
    nnCopy?.description ??
    "Call new leads first — then follow up until initial invoice is paid.";

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="hidden rounded-xl bg-navy px-4 py-3 md:block">
          <BrandLogo variant="default" theme="dark" href="/workspace" />
        </div>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <p className="text-base font-semibold text-navy md:hidden">{greeting()}, {ownerName}</p>
          <WorkspaceRefreshButton loading={loading} onClick={() => void reload()} />
        </div>
      </div>

      <div className="hidden md:block">
        <WorkspacePageHeader
          title={`${greeting()}, ${ownerName}`}
          description={homeDescription}
        />
      </div>
      <p className="mb-6 text-sm text-slate-600 md:hidden">{homeDescription}</p>

      {error && <WorkspaceErrorState message={error} onRetry={() => void reload()} />}

      {p && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:hidden">
            <WorkspaceKpiCard
              label="New leads"
              value={p.uncontactedNew}
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              tone={p.uncontactedNew > 0 ? "orange" : "neutral"}
              href="/workspace/inbox"
            />
            <WorkspaceKpiCard
              label="Follow-up"
              value={p.followUpDue}
              icon={<Calendar className="h-4 w-4 text-blue-500" />}
              tone="blue"
              href="/workspace/callbacks"
            />
            <WorkspaceKpiCard
              label="Overdue"
              value={isNn ? (p.overdueCases ?? 0) : (p.followUpOverdue ?? 0)}
              icon={<Phone className="h-4 w-4 text-red-500" />}
              tone={(isNn ? (p.overdueCases ?? 0) : (p.followUpOverdue ?? 0)) > 0 ? "red" : "neutral"}
              href="/workspace/callbacks"
            />
            <WorkspaceKpiCard
              label={isNn ? "Revenue this month" : "Invoice this month"}
              value={
                isNn
                  ? formatEurAmount(p.revenueThisMonth ?? 0)
                  : formatCurrency(p.invoiceThisMonth ?? p.revenueThisMonth)
              }
              icon={<Euro className="h-4 w-4 text-emerald-600" />}
              tone="green"
              href="/workspace/completions"
            />
          </div>
          <div className="mb-6 hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-5">
            <WorkspaceKpiCard
              label="New leads"
              value={p.uncontactedNew}
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              tone={p.uncontactedNew > 0 ? "orange" : "neutral"}
              href="/workspace/inbox"
            />
            <WorkspaceKpiCard
              label="Follow-up"
              value={p.followUpDue}
              icon={<Calendar className="h-4 w-4 text-blue-500" />}
              tone="blue"
              href="/workspace/callbacks"
            />
            <WorkspaceKpiCard
              label="Overdue"
              value={isNn ? (p.overdueCases ?? 0) : (p.followUpOverdue ?? 0)}
              icon={<Phone className="h-4 w-4 text-red-500" />}
              tone={(isNn ? (p.overdueCases ?? 0) : (p.followUpOverdue ?? 0)) > 0 ? "red" : "neutral"}
              href="/workspace/callbacks"
            />
            <WorkspaceKpiCard
              label={isNn ? "Revenue this month" : "Invoice this month"}
              value={
                isNn
                  ? formatEurAmount(p.revenueThisMonth ?? 0)
                  : formatCurrency(p.invoiceThisMonth ?? 0)
              }
              icon={<Euro className="h-4 w-4 text-emerald-600" />}
              tone="green"
              href="/workspace/completions"
            />
            <WorkspaceKpiCard
              label={isNn ? "Pipeline value" : "Commission this month"}
              value={
                isNn
                  ? formatEur(p.expectedRevenue ?? 0)
                  : formatCurrency(p.commissionThisMonth ?? 0)
              }
              icon={<Euro className="h-4 w-4 text-emerald-600" />}
              tone="green"
              href={isNn ? "/workspace/applications" : "/workspace/sources"}
            />
          </div>
        </>
      )}

      <div className="mb-8 hidden flex-wrap gap-2 md:flex">
        {quickLinks.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:shadow ${
              tone === "orange"
                ? "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100"
                : tone === "violet"
                  ? "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {loading && !data && !error && <WorkspaceSkeletonCards count={4} />}

      {pr && (
        <div className="space-y-8">
          {callNow.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Call now
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                    {callNow.length}
                  </span>
                </h2>
                <Link href="/workspace/inbox" className="text-xs font-semibold text-gold-ink hover:underline">
                  View all →
                </Link>
              </div>
              {displayCallNow.map((c) => (
                <CaseCard key={c.caseId} caseItem={c} onRefresh={reload} showQueue />
              ))}
            </section>
          )}

          {followUpActive.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Follow-up
                  {(p?.followUpOverdue ?? 0) > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                      {p?.followUpOverdue} overdue
                    </span>
                  )}
                </h2>
                <Link href="/workspace/callbacks" className="text-xs font-semibold text-gold-ink hover:underline">
                  View all →
                </Link>
              </div>
              {displayFollowUp.map((c) => (
                <CaseCard
                  key={c.caseId}
                  caseItem={c}
                  onRefresh={reload}
                  showQueue
                />
              ))}
            </section>
          )}

          {callNow.length === 0 && followUpActive.length === 0 && !loading && !error && (
            <WorkspaceEmptyState
              title="All clear"
              description={
                isNn
                  ? "No new enquiries or follow-ups right now. Soft-capture and completed quizzes land in New enquiries."
                  : "No new leads or follow-ups. Completed deals and revenue are in Sources."
              }
              action={
                <Link
                  href="/workspace/inbox"
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
                >
                  {isNn ? "Browse new enquiries" : "Browse new leads"}
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
