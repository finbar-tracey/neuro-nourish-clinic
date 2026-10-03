import { NeuroNourishMark } from "@/components/brand/neuronourish-mark";

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
  return (
    <NeuroNourishMark
      variant={variant}
      theme={theme}
      className={className}
      href={href}
    />
  );
}
