"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

interface CounterProps {
  // The final number to count up to.
  value: number;
  // Tween length in seconds.
  durationSec?: number;
  // Fixed decimal places in the rendered number.
  decimals?: number;
  // Thousands grouping. Turn off for figures like years (2024, not 2,024).
  useGrouping?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

// Counts from zero up to a value when it scrolls into view. The final value is
// what renders on the server, so the figure is correct with no JavaScript and
// under reduced motion. When motion runs, the layout effect resets to zero
// before paint, so the count starts clean with no flash of the final number.
export function Counter({
  value,
  durationSec = 1.4,
  decimals = 0,
  useGrouping = true,
  prefix = "",
  suffix = "",
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const format = (n: number) =>
    `${prefix}${n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping,
    })}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) {
        return;
      }
      const state = { n: 0 };
      el.textContent = format(0);
      gsap.to(state, {
        n: value,
        duration: durationSec,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = format(state.n);
        },
      });
    },
    { scope: ref, dependencies: [value] },
  );

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
