import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { CoverageState } from "@/lib/coverage";
import { stateLabel } from "@/lib/coverage";

const stampVariants = cva(
  "inline-flex h-6 flex-none items-center gap-1.5 rounded-[2px] border px-2 font-mono text-micro font-medium tracking-[0.06em] whitespace-nowrap uppercase",
  {
    variants: {
      state: {
        covered: "border-covered/40 bg-covered-tint text-covered",
        short: "border-short/40 bg-short-tint text-short",
        stale: "border-stale/40 bg-stale-tint text-stale",
      },
    },
  },
);

function StateGlyph({ state }: { state: CoverageState }) {
  if (state === "covered") {
    return <span aria-hidden="true" className="h-3 w-0.5 bg-covered-fill" />;
  }
  if (state === "short") {
    return (
      <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5 fill-short-fill">
        <path d="M0 1h10L5 9z" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="size-2.5 rounded-[1px] border border-dashed border-stale-fill"
    />
  );
}

interface StateStampProps {
  state: CoverageState;
  label?: string;
  className?: string;
}

export function StateStamp({ state, label, className }: StateStampProps) {
  return (
    <span className={cn(stampVariants({ state }), className)}>
      <StateGlyph state={state} />
      {label ?? stateLabel[state]}
    </span>
  );
}
