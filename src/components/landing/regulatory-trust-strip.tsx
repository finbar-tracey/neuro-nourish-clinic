import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function RegulatoryTrustStrip({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        `flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl px-4 py-3 text-xs ${
          isDark
            ? "border border-white/10 bg-white/5 text-slate-300"
            : "border border-slate-200 bg-slate-50 text-slate-600"
        }`,
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <ShieldCheck className={`h-3.5 w-3.5 ${isDark ? "text-gold" : "text-gold-ink"}`} />
        Broker, not a lender
      </span>
      <span className="hidden sm:inline text-slate-400">·</span>
      <span>Investment & business purposes only</span>
      <span className="hidden sm:inline text-slate-400">·</span>
      <span>Subject to status</span>
      <span className="hidden sm:inline text-slate-400">·</span>
      <span>No hard credit check to enquire</span>
    </div>
  );
}
