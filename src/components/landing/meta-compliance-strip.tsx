import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "hero" | "light" | "footer";
  className?: string;
};

export function MetaComplianceStrip({ variant = "light", className }: Props) {
  const isHero = variant === "hero";
  const isFooter = variant === "footer";

  return (
    <p
      className={cn(
        "text-center leading-relaxed",
        isFooter ? "text-[10px] text-slate-400" : "text-[11px] sm:text-xs",
        isHero
          ? "rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-slate-300"
          : isFooter
            ? ""
            : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-600",
        className,
      )}
    >
      <span className="font-medium">Broker, not a lender</span>
      <span aria-hidden="true" className="mx-1.5 text-slate-400">
        ·
      </span>
      Business &amp; investment only
      <span aria-hidden="true" className="mx-1.5 text-slate-400">
        ·
      </span>
      Subject to status
      {!isFooter && (
        <>
          <span aria-hidden="true" className="mx-1.5 text-slate-400">
            ·
          </span>
          <Link
            href="/privacy"
            className={cn(
              "underline underline-offset-2",
              isHero ? "text-gold hover:text-gold-light" : "text-gold-ink hover:text-gold-dark",
            )}
          >
            Privacy
          </Link>
        </>
      )}
    </p>
  );
}
