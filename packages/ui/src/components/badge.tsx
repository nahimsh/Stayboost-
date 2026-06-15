import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@stayboost/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
