import { useId } from "react";
import { cn } from "@/lib/utils";
import { WORDMARK_PATH } from "./wordmark-path";

interface BrandWatermarkProps {
  className?: string;
}

export function BrandWatermark({ className }: BrandWatermarkProps) {
  const id = useId();
  return (
    <svg
      viewBox="2.5 -69.5 223 71"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--s-text)" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="var(--s-text)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--s-text)" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d={WORDMARK_PATH} fill={`url(#${id})`} />
    </svg>
  );
}
