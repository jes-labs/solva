"use client";

import { ArrowUpIcon } from "@phosphor-icons/react";
import { useBackToTop } from "@/hooks/use-back-to-top";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const { ring, visible, toTop } = useBackToTop();

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      inert={!visible}
      className={cn(
        "group fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-bg/80 text-text backdrop-blur-sm transition-[opacity,translate] duration-300 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx={24}
          cy={24}
          r={22}
          fill="none"
          strokeWidth={1.5}
          className="stroke-line-strong"
        />
        <circle
          ref={ring}
          cx={24}
          cy={24}
          r={22}
          fill="none"
          strokeWidth={1.5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          className="stroke-signal [transition:none]"
        />
      </svg>
      <ArrowUpIcon
        aria-hidden="true"
        className="relative size-4 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
