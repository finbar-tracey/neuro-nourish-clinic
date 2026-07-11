import { GOOGLE_RATING } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { Clock, ShieldCheck } from "lucide-react";

type Props = {
  className?: string;
  /** For dark backgrounds (hero, navy sections) */
  dark?: boolean;
  compact?: boolean;
};

export function ConversionTrustLine({ className, dark, compact }: Props) {
  const text = dark ? "text-slate-200" : "text-slate-600";
  const strong = dark ? "text-white" : "text-navy";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1",
        compact ? "text-[10px]" : "text-xs",
        text,
        className,
      )}
    >
      <span className={cn("inline-flex items-center gap-1 font-semibold", strong)}>
        <StarRating size="xs" className="mr-0.5" />
        {GOOGLE_RATING.label} on Google
      </span>
      <span aria-hidden="true">·</span>
      <span>{GOOGLE_RATING.count} Google reviews</span>
      {!compact && (
        <>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Clock className="h-3 w-3 text-gold-ink" />
            2-hour response
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <ShieldCheck className="h-3 w-3 text-gold-ink" />
            No hard credit check
          </span>
        </>
      )}
    </div>
  );
}
