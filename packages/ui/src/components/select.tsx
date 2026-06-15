import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@stayboost/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** A styled native select — reliable, accessible, and mobile-friendly. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";
