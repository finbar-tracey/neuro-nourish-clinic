import Link from "next/link";
import { cn } from "@/lib/utils";
import { bookedConsultBrandName, healthcareClinicPublicName } from "@/lib/vertical-config";

type BookedConsultMarkProps = {
  variant?: "default" | "compact" | "footer";
  /** On navy hero backgrounds */
  theme?: "dark" | "light";
  className?: string;
  href?: string;
  showPartner?: boolean;
};

export function BookedConsultMark({
  variant = "default",
  theme = "light",
  className,
  href = "/",
  showPartner = false,
}: BookedConsultMarkProps) {
  const name = bookedConsultBrandName();
  const partner = healthcareClinicPublicName();
  const onDark = theme === "dark";

  const badgeSize =
    variant === "footer"
      ? "h-12 w-12 text-sm"
      : variant === "compact"
        ? "h-9 w-9 text-[10px]"
        : "h-11 w-11 text-xs";
  const titleSize =
    variant === "footer"
      ? "text-sm"
      : variant === "compact"
        ? "text-[10px] sm:text-xs"
        : "text-xs sm:text-sm";

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg font-bold",
          badgeSize,
          onDark ? "bg-gold text-navy" : "bg-navy text-gold",
        )}
      >
        BC
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-semibold tracking-tight",
            titleSize,
            onDark ? "text-white" : "text-navy",
          )}
        >
          {name}
        </span>
        {showPartner && partner !== name && (
          <span
            className={cn(
              "block text-[10px] font-medium sm:text-xs",
              onDark ? "text-slate-300" : "text-slate-500",
            )}
          >
            {partner}
          </span>
        )}
      </span>
    </Link>
  );
}
