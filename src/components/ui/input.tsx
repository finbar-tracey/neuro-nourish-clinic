import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "touch-input flex h-12 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-base text-navy placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:h-11 sm:text-sm",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "touch-input flex h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-base text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:h-11 sm:text-sm",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-navy placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:text-sm",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("mb-1 block text-xs font-medium text-navy sm:mb-1.5 sm:text-sm", className)}
    {...props}
  />
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
