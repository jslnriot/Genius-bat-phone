import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-primary text-sm font-medium"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "text-primary placeholder:text-secondary-text focus:border-action focus:ring-action/20 flex h-12 w-full rounded-(--radius-input) border border-border bg-white px-3.5 py-3 text-base focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-error focus:border-error focus:ring-error/15",
            className,
          )}
          ref={ref}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={error ? errorId : ariaDescribedBy}
          {...props}
        />
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-error text-sm leading-5"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
