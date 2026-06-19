import * as React from "react";
import { cn } from "../lib/cn";

// Solvency status pill. This is the one piece of domain UI worth sharing across
// the dashboard and the public verify page so the wording and color stay
// consistent. It speaks plain language, never chain detail.
export type StatusTone = "solvent" | "breach" | "warning" | "unknown";

const toneClasses: Record<StatusTone, string> = {
  solvent: "bg-solvent/10 text-solvent",
  breach: "bg-breach/10 text-breach",
  warning: "bg-warning/10 text-warning",
  unknown: "bg-muted text-muted-foreground",
};

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  label: string;
}

export function StatusPill({ tone, label, className, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
