import { NeuroNourishMark } from "@/components/brand/neuronourish-mark";
import { BookedConsultMark } from "@/components/brand/booked-consult-mark";
import { isHealthcareVertical, isNeuronourishVertical } from "@/lib/vertical-config";

type Props = {
  variant?: "default" | "compact" | "footer";
  /** "dark" on navy backgrounds. "light" on white/cream backgrounds. */
  theme?: "dark" | "light";
  className?: string;
  href?: string;
};

export function BrandLogo({
  variant = "default",
  theme = "dark",
  className,
  href = "/",
}: Props) {
  if (isHealthcareVertical()) {
    return (
      <BookedConsultMark
        variant={variant}
        theme={theme}
        className={className}
        href={href}
        showPartner={variant === "default"}
      />
    );
  }

  return (
    <NeuroNourishMark
      variant={variant}
      theme={theme}
      className={className}
      href={href}
    />
  );
}
