import { cn } from "@/lib/cn";
import { CheckIcon } from "./icons";

interface VerifiedBadgeProps {
  children?: React.ReactNode;
  className?: string;
}

// The "Verified on Stellar" mark: a check in the accent next to a mono label.
export function VerifiedBadge({ children = "Verified on Stellar", className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-hair bg-surface px-3 py-1.5 font-mono text-[11.5px] text-sec",
        className,
      )}
    >
      <CheckIcon size={13} className="text-acc-text" />
      {children}
    </span>
  );
}
