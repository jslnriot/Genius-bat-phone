import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-muted-background)] text-[var(--color-primary)]",
        success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
        warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
        error: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
        action: "bg-[var(--color-action)]/10 text-[var(--color-action)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
