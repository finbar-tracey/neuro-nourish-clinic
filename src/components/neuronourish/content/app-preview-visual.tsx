"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { NN_APP } from "@/lib/neuronourish-copy";

type AppPreviewVisualProps = {
  /** Prefer real screenshot on product pages; keep mock animation on homepage. */
  variant?: "mock" | "screenshot";
};

export function AppPreviewVisual({ variant = "mock" }: AppPreviewVisualProps) {
  const rows = NN_APP.previewMetrics;
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionOk(!mq.matches);

    const onChange = () => setMotionOk(!mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!motionOk || variant === "screenshot") return;
    const tick = setInterval(() => setActive((i) => (i + 1) % rows.length), 2800);
    return () => clearInterval(tick);
  }, [rows.length, motionOk, variant]);

  if (variant === "screenshot") {
    return (
      <div className="nn-app-preview rounded-2xl border border-mist bg-linen/25 p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <span className="nn-badge">{NN_APP.badge}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink/45">
            App preview
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-mist bg-white shadow-sm">
          <Image
            src={NN_APP.previewImage}
            alt={NN_APP.previewImageAlt}
            width={1200}
            height={900}
            className="h-auto w-full object-cover object-top"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>
        <p className="mt-4 text-center text-xs text-ink/55">{NN_APP.caption}</p>
      </div>
    );
  }

  return (
    <div className="nn-app-preview rounded-2xl border border-mist bg-white p-6 shadow-[0_12px_32px_rgba(26,51,72,0.08)] sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="nn-badge">{NN_APP.badge}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink/45">
          Live preview
        </span>
      </div>

      <div
        className="mx-auto w-[16.5rem] rounded-[2.15rem] border-[6px] border-deep-slate/14 bg-white p-5 shadow-[0_18px_40px_rgba(27,58,92,0.16)] sm:w-[19rem]"
        aria-hidden
      >
        <div className="rounded-2xl bg-deep-slate px-3 py-2 text-center text-[10px] font-medium tracking-wide text-ivory">
          NeuroNourish
        </div>
        <div
          className="mt-3 space-y-1.5"
          aria-live={motionOk ? "polite" : undefined}
          aria-label="Daily habit metrics"
        >
          {rows.map((row, i) => {
            const isActive = motionOk ? i === active : i === 0;
            const barWidth = mounted ? (isActive ? row.pct : Math.max(row.pct - 14, 28)) : 0;

            return (
              <div
                key={row.label}
                className={`rounded-lg px-2.5 py-1.5 transition-all duration-500 ${
                  isActive ? "bg-gold/10 ring-1 ring-gold/35" : "bg-ivory"
                }`}
              >
                <div className="flex justify-between text-[10px] text-ink/60">
                  <span>{row.label}</span>
                  <span className="font-medium text-slate-blue">{row.pct}%</span>
                </div>
                <p className="text-xs font-medium leading-tight text-slate-blue">{row.value}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-linen">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-center">
        <div>
          <p className="font-display text-3xl text-slate-blue">
            {NN_APP.previewStats[0].value}
            <span className="ml-1 text-sm font-sans font-normal text-ink/55">
              {NN_APP.previewStats[0].suffix}
            </span>
          </p>
          <p className="text-xs text-ink/60">{NN_APP.previewStats[0].label}</p>
        </div>
        <div className="h-10 w-px bg-mist" aria-hidden />
        <div>
          <p className="font-display text-3xl text-slate-blue">
            {NN_APP.previewStats[1].value}
            <span className="text-xl">%</span>
          </p>
          <p className="text-xs text-ink/60">{NN_APP.previewStats[1].label}</p>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-ink/55">{NN_APP.caption}</p>
    </div>
  );
}
