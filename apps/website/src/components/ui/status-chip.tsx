import { cn } from "@/lib/cn";

export type SolvencyStatus = "solvent" | "near-breach" | "insolvent";

// Dot color per status. Chartreuse means solvent, the one place this signal is
// earned. Amber and red carry the warning and failure states.
const dotColor: Record<SolvencyStatus, string> = {
  solvent: "bg-acc",
  "near-breach": "bg-amber",
  insolvent: "bg-red",
};

const defaultLabel: Record<SolvencyStatus, string> = {
  solvent: "Solvent",
  "near-breach": "Near-breach",
  insolvent: "Insolvent",
};

interface StatusChipProps {
  status: SolvencyStatus;
  label?: string;
  className?: string;
}

// A pill that shows a solvency state with a colored dot.
export function StatusChip({ status, label, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-hair px-3 py-1.5 font-mono text-xs text-fg",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotColor[status])} aria-hidden="true" />
      {label ?? defaultLabel[status]}
    </span>
  );
}
