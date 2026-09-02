import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] focus-visible:ring-opacity-50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-action)] text-white hover:bg-[var(--color-action)]/90",
        secondary: "bg-white text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-[var(--color-muted-background)]",
        destructive: "text-[var(--color-error)] bg-transparent hover:bg-[var(--color-error)]/10",
        ghost: "hover:bg-[var(--color-muted-background)]",
        link: "text-[var(--color-action)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 rounded-[var(--radius-button)]",
        sm: "h-10 px-4 rounded-[var(--radius-button)] text-sm",
        lg: "h-14 px-8 rounded-[var(--radius-button)]",
        icon: "h-11 w-11 rounded-[var(--radius-button)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
