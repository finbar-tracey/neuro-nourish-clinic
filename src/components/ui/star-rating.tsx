import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "xs" | "sm" | "md";
};

const sizes = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

/** Single accessible star row — fewer DOM nodes than five Lucide icons. */
export function StarRating({ className, size = "sm" }: Props) {
  const iconClass = sizes[size];
  return (
    <span
      className={cn("inline-flex gap-0.5 text-gold-ink", className)}
      role="img"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={cn(iconClass, "fill-current")}
          aria-hidden
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.94.94-5.5-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
