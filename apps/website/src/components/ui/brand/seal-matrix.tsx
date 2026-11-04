import { useId } from "react";
import { cn } from "@/lib/utils";
import { LONG_TICKS, MARK_PATH, MARK_TRANSFORM, SHORT_TICKS } from "./seal-geometry";

interface SealMatrixProps {
  className?: string;
}

export function SealMatrix({ className }: SealMatrixProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={cn("block h-auto w-full", className)}>
      <defs>
        <pattern id={`${id}-dots`} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.62" fill="var(--s-signal-border)" />
        </pattern>
        <mask id={`${id}-shape`}>
          <rect width="120" height="120" fill="black" />
          <g stroke="white" strokeLinecap="round">
            <g strokeWidth={2.6}>
              {SHORT_TICKS.map((tick) => (
                <line key={`s-${tick.x2}-${tick.y2}`} {...tick} />
              ))}
            </g>
            <g strokeWidth={3.2}>
              {LONG_TICKS.map((tick) => (
                <line key={`l-${tick.x2}-${tick.y2}`} {...tick} />
              ))}
            </g>
          </g>
          <g transform={MARK_TRANSFORM}>
            <path
              d={MARK_PATH}
              fill="none"
              stroke="white"
              strokeWidth={14}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        </mask>
      </defs>
      <rect
        width="120"
        height="120"
        fill={`url(#${id}-dots)`}
        mask={`url(#${id}-shape)`}
        opacity="0.75"
      />
    </svg>
  );
}
