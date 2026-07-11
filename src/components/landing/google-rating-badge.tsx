import Link from "next/link";
import { GOOGLE_RATING } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";

type Props = {
  variant?: "inline" | "card" | "compact" | "mobile";
  /** Light text for dark backgrounds (e.g. navy header) */
  inverted?: boolean;
  className?: string;
  href?: string;
};

export function GoogleRatingBadge({
  variant = "inline",
  inverted = false,
  className = "",
  href,
}: Props) {
  const content =
    variant === "mobile" ? (
      <div className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1", className)}>
        <GoogleLogo className="h-4 w-4 shrink-0" />
        <StarRating size="xs" />
        <span className={cn("text-xs font-bold", inverted ? "text-white" : "text-navy")}>
          {GOOGLE_RATING.label} on Google
        </span>
        <span className={cn("text-xs", inverted ? "text-slate-300" : "text-slate-600")}>
          · {GOOGLE_RATING.count} reviews
        </span>
        <span className={cn("text-xs font-medium", inverted ? "text-slate-200" : "text-gold-ink")}>
          · 2hr response
        </span>
      </div>
    ) : variant === "compact" ? (
      <div className={cn("flex items-center gap-2", className)}>
        <GoogleLogo className="h-4 w-4 shrink-0" />
        <StarRating size="xs" />
        <span
          className={cn(
            "text-xs font-semibold",
            inverted ? "text-white" : "text-navy",
          )}
        >
          {GOOGLE_RATING.label} on Google
        </span>
        <span
          className={cn("text-xs", inverted ? "text-slate-300" : "text-slate-600")}
        >
          · {GOOGLE_RATING.count} reviews
        </span>
      </div>
    ) : variant === "card" ? (
      <div
        className={cn(
          "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
          className,
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <GoogleLogo className="h-5 w-5" />
          <span className="text-xs text-slate-600">Verified reviews</span>
        </div>
        <p className="font-display text-2xl font-medium text-navy">
          {GOOGLE_RATING.label}
        </p>
        <StarRating size="md" className="my-2" />
        <p className="text-sm text-slate-600">
          Based on <strong>{GOOGLE_RATING.count} Google reviews</strong> · {GOOGLE_RATING.score}/5
        </p>
      </div>
    ) : (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <GoogleLogo className="h-5 w-5 shrink-0" />
        <StarRating size="sm" />
        <span className="text-sm font-semibold text-white">
          {GOOGLE_RATING.label} on Google
        </span>
        <span className="text-sm text-slate-400">
          · {GOOGLE_RATING.count} verified reviews
        </span>
      </div>
    );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

function GoogleLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
