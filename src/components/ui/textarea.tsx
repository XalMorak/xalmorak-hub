import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg bg-raised px-3.5 py-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle",
        "transition-[box-shadow] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
