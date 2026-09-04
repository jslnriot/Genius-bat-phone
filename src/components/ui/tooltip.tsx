import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  className?: string;
  children: React.ReactElement;
};

export function Tooltip({ label, className, children }: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-[0_1px_2px_rgba(15,23,42,0.15)] transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
