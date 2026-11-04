import type { CoverageState } from "@/lib/coverage";
import { cn } from "@/lib/utils";
import { summarizeDays } from "../lib/history";

const TONE: Record<CoverageState, string> = {
  covered: "bg-text",
  short: "bg-short-fill",
  stale: "border-l-2 border-dotted border-line-strong bg-transparent",
};

interface DayTicksProps {
  days: readonly CoverageState[];
  label: string;
  className?: string;
}

export function DayTicks({ days, label, className }: DayTicksProps) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${summarizeDays(days)}`}
      data-ticks
      className={cn("flex h-4 items-stretch justify-between gap-0.5", className)}
    >
      {days.map((state, day) => (
        <span
          key={day}
          aria-hidden="true"
          className={cn(
            "w-0.5",
            day === days.length - 1 && state === "covered" ? "bg-signal" : TONE[state],
          )}
        />
      ))}
    </div>
  );
}
