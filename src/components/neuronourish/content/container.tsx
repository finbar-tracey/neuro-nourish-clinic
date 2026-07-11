import type { ReactNode } from "react";

type Width = "sm" | "md" | "lg" | "xl";

const widths: Record<Width, string> = {
  sm: "max-w-lg",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function PageContainer({
  children,
  width = "md",
  className = "",
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <div className={`mx-auto ${widths[width]} px-4 sm:px-6 ${className}`}>{children}</div>
  );
}

export function PageSection({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`px-4 py-16 sm:px-6 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}
