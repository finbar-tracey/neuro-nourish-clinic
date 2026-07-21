import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Approved brand assets — brain icon (header) + full lockups (footer / dark). */
export const NN_BRAND_ASSETS = {
  brain: "/brand/neuronourish-brain.png",
  logo: "/brand/neuronourish-logo.png",
  logoDark: "/brand/neuronourish-logo-dark.png",
} as const;

type Props = {
  variant?: "default" | "compact" | "footer";
  /** "dark" on navy/violet backgrounds. "light" on ivory/cream. */
  theme?: "dark" | "light";
  className?: string;
  href?: string;
};

export function NeuroNourishMark({
  variant = "default",
  theme = "light",
  className,
  href = "/",
}: Props) {
  if (variant === "footer") {
    const src = theme === "dark" ? NN_BRAND_ASSETS.logoDark : NN_BRAND_ASSETS.logo;
    return (
      <Link href={href} className={cn("inline-flex shrink-0", className)}>
        <Image
          src={src}
          alt="NeuroNourish Clinic"
          width={220}
          height={220}
          className={cn("h-auto object-contain", className ?? "w-[min(100%,220px)]")}
          style={{ height: "auto" }}
        />
      </Link>
    );
  }

  const brainClass =
    variant === "compact" ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11";

  const brainPadding = variant === "compact" ? "p-0.5" : "p-1";

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("inline-flex shrink-0 items-center", brainPadding, className)}>
        <Image
          src={NN_BRAND_ASSETS.brain}
          alt="NeuroNourish Clinic"
          width={558}
          height={448}
          className={cn("shrink-0 object-contain", brainClass)}
          priority
          unoptimized
        />
      </Link>
    );
  }

  const titleColor = theme === "dark" ? "text-ivory" : "text-deep-slate";

  // Clear space ≈ ¼ icon height (NN_LOGO.clearSpaceRatio) via padding on the lockup.
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 sm:gap-3",
        variant === "compact" ? "p-1" : "p-1.5 sm:p-2",
        className,
      )}
      aria-label="NeuroNourish Clinic"
    >
      <Image
        src={NN_BRAND_ASSETS.brain}
        alt=""
        width={558}
        height={448}
        className={cn("shrink-0 object-contain", brainClass)}
        priority
        unoptimized
        aria-hidden
      />
      <span
        className={cn(
          "font-display text-base tracking-tight sm:text-lg",
          titleColor,
        )}
      >
        NeuroNourish
      </span>
    </Link>
  );
}
