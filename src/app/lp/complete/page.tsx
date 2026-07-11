import { MetaCompleteForm } from "@/components/forms/meta-complete-form";
import { BrandLogo } from "@/components/brand/logo";
import { verifyCompletionToken } from "@/lib/completion-link";
import { db } from "@/lib/db";
import { buildPageMetadata, NOINDEX_ROBOTS } from "@/lib/seo";
import { normalizeLeadId } from "@/lib/sms-links";
import { QualifiedThankYouScreen } from "@/components/forms/qualified-thank-you";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Complete Your Enquiry | Bridging Loans Broker",
    description: "Finish your property finance eligibility check with Daniel at Bridging Loans Broker.",
    path: "/lp/complete",
  }),
  robots: NOINDEX_ROBOTS,
};

type SearchParams = Promise<{ lead?: string; token?: string }>;

export default async function MetaCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const leadId = normalizeLeadId(params.lead ?? null);
  const token = params.token?.trim() ?? "";

  if (!leadId || !verifyCompletionToken(leadId, token)) {
    return (
      <PageShell>
        <InvalidLink message="This link is invalid or has expired. Check your SMS or email for the latest link." />
      </PageShell>
    );
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return (
      <PageShell>
        <InvalidLink message="We could not find your enquiry. Please submit a new enquiry or call 020 7177 4141." />
      </PageShell>
    );
  }

  if (lead.formCompleted) {
    return (
      <PageShell>
        <QualifiedThankYouScreen
          firstName={lead.firstName}
          loanAmount={lead.loanAmount}
          loanPurpose={lead.loanPurpose}
          timeframe={lead.timeframe}
          propertyType={lead.propertyType}
          propertyLocation={lead.propertyLocation}
          leadId={lead.id}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <MetaCompleteForm
        lead={{
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          loanPurpose: lead.loanPurpose,
          loanAmount: lead.loanAmount,
          timeframe: lead.timeframe,
        }}
        completionToken={token}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/">
            <BrandLogo variant="compact" />
          </Link>
          <p className="text-xs text-slate-500">Secure enquiry</p>
        </div>
      </header>
      <main className="px-4 py-8">{children}</main>
    </div>
  );
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="font-display text-lg font-semibold text-navy">Link unavailable</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-semibold text-gold-ink underline"
      >
        Return to homepage
      </Link>
    </div>
  );
}
