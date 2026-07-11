import Link from "next/link";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NOINDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: NOINDEX_ROBOTS,
};

export default function NotFound() {
  return (
    <NeuroNourishShell>
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-deep-slate">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          This page doesn&apos;t exist. Start with our brain health quiz or return to the homepage.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <GoldButton href="/quiz">Take the Brain Health Quiz</GoldButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-deep-slate/25 px-6 py-3 text-[13px] font-medium text-deep-slate hover:bg-linen/40"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </NeuroNourishShell>
  );
}
