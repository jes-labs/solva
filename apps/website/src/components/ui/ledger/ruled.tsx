import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RuledProps {
  children: ReactNode;
  className?: string;
  marks?: boolean;
}

export function Ruled({ children, className, marks = false }: RuledProps) {
  return (
    <div
      data-reveal
      className={cn("relative border border-line", marks && "ruled-marks", className)}
    >
      {children}
    </div>
  );
}

interface RuledGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function RuledGrid({ children, columns = 4, className }: RuledGridProps) {
  return (
    <div
      data-rows
      className={cn("ruled-grid grid border border-line", COLUMNS[columns], className)}
    >
      {children}
    </div>
  );
}

interface CellProps {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  className?: string;
}

export function Cell({ label, value, note, className }: CellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 p-5 sm:p-6", className)}>
      <p className="text-small text-sec">{label}</p>
      <p className="min-w-0 font-display text-[clamp(1.5rem,1rem+1.7vw,2.5rem)] leading-[1.05] tracking-[-0.02em] break-words num">
        {value}
      </p>
      {note ? <p className="font-mono text-micro text-sec num">{note}</p> : null}
    </div>
  );
}

interface LeaderRowProps {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "signal" | "short";
}

export function LeaderRow({ label, value, tone = "default" }: LeaderRowProps) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-small num">
      <span className="min-w-0 shrink text-sec">{label}</span>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 border-b border-dotted border-line-strong"
      />
      <span
        className={cn(
          "min-w-0 max-w-[70%] shrink text-right text-text",
          tone === "signal" && "tick-lead",
          tone === "short" && "text-short",
        )}
      >
        {value}
      </span>
    </div>
  );
}
