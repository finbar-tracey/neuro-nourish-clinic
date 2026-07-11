"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NN_NAV } from "@/lib/neuronourish-copy";

function closeOnNavigate(handler: () => void) {
  return () => handler();
}

export function NeuroNourishHeaderNavMobile() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href="/quiz"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-3 py-2 text-[12px] font-medium text-deep-slate transition hover:bg-gold/90 sm:px-4 sm:text-[13px]"
        >
          <span className="sm:hidden">{NN_NAV.ctaQuizShort}</span>
          <span className="hidden sm:inline">{NN_NAV.ctaQuiz}</span>
        </Link>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-ivory/20 text-ivory"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-deep-slate/60 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="fixed inset-x-0 z-50 max-h-[min(70dvh,28rem)] overflow-y-auto border-b border-linen bg-ivory px-4 py-4 shadow-lg lg:hidden"
            style={{ top: "calc(4.25rem + env(safe-area-inset-top, 0px))" }}
            aria-label="Mobile"
          >
            <ul className="space-y-1">
              {NN_NAV.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-[48px] items-center rounded-lg px-3 text-[15px] font-medium text-slate-blue hover:bg-linen/50"
                    onClick={closeOnNavigate(() => setOpen(false))}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-linen pt-3">
              <Link
                href="/discovery"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-deep-slate/20 px-4 text-[13px] font-medium text-deep-slate hover:bg-linen/50"
                onClick={closeOnNavigate(() => setOpen(false))}
              >
                {NN_NAV.ctaDiscovery}
              </Link>
              <Link
                href="/quiz"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-4 text-[13px] font-medium text-deep-slate hover:bg-gold/90"
                onClick={closeOnNavigate(() => setOpen(false))}
              >
                {NN_NAV.ctaQuiz}
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </>
  );
}
