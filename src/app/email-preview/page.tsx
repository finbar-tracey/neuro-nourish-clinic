import { journeyEmailCatalog } from "@/lib/journey-emails";
import { brandedEmailHtml, logoDataUri } from "@/lib/email-templates";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Email design preview — Bridging Loans Broker",
  robots: { index: false, follow: false },
};

/** Local/staging only — never expose production email previews publicly */
function previewAllowed() {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.EMAIL_PREVIEW_ENABLED === "true") return true;
  return false;
}

export default function EmailPreviewPage() {
  if (!previewAllowed()) notFound();

  const logoUri = logoDataUri();
  const catalog = journeyEmailCatalog().filter((e) => e.audience === "borrower");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy px-6 py-10 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Design preview — no emails sent
        </p>
        <h1 className="mt-2 text-3xl font-bold">Branded email templates</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
          Navy header, orange accent, logo, and cream signature block — matching the
          landing page. Run{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-gold-light">
            npm run email:preview
          </code>{" "}
          to export HTML + a print-ready PDF guide in{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">email-previews/</code>.
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {catalog.map((entry) => {
          const rendered = brandedEmailHtml(entry.body, entry.subject, {
            ...entry.options,
            embedInlineAssets: true,
            logoUrl: logoUri ?? undefined,
            stageLabel: entry.stage,
            preheader: entry.subject,
            showPhoneCta: entry.options?.showPhoneCta !== false,
          });

          return (
            <section
              key={entry.id}
              id={entry.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-brand-cream px-5 py-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={
                        entry.status === "live"
                          ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800"
                          : "rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-orange-900"
                      }
                    >
                      {entry.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      {entry.stage}
                    </span>
                  </div>
                  <h2 className="mt-2 font-semibold text-navy">{entry.subject}</h2>
                  <p className="mt-1 text-xs text-slate-500">{entry.trigger}</p>
                </div>
              </div>
              <iframe
                title={entry.subject}
                srcDoc={rendered}
                className="h-[720px] w-full border-0 bg-slate-100"
                sandbox=""
              />
            </section>
          );
        })}
      </main>
    </div>
  );
}
