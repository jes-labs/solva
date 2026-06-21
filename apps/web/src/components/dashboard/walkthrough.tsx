"use client";

import { useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { hasSeenTour, startTour } from "@/lib/walkthrough/tour";

// Runs the product tour on first visit, and exposes a replay button. Mounted on
// the overview, where the tour's target ids exist.
export function Walkthrough() {
  useEffect(() => {
    if (hasSeenTour()) return;
    // Let the layout settle before highlighting elements.
    const timer = window.setTimeout(() => startTour(), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      onClick={() => startTour()}
      className="inline-flex items-center gap-1.5 text-[13px] text-sec transition-colors hover:text-fg"
    >
      <HelpCircle className="size-4" />
      Take a tour
    </button>
  );
}
