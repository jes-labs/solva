import { cn } from "@/lib/utils";
import { WORDMARK_PATH } from "./wordmark-path";
import { SealMarkPath, SealTicks } from "./seal-ticks";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <svg viewBox="0 0 366.5 120" className={cn("h-7 w-auto", className)} role="img">
      <title>Solva</title>
      <SealTicks />
      <SealMarkPath />
      <g transform="translate(132,92)">
        <path d={WORDMARK_PATH} className="fill-text" />
      </g>
    </svg>
  );
}
