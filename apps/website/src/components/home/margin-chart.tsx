"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

// Load recharts only when the chart is about to be shown, so the library is not
// in the initial bundle.
const MarginChartImpl = dynamic(() => import("./margin-chart-impl"), { ssr: false });

// The reserves-over-liabilities chart wrapper. It watches for the chart to scroll
// into view, then mounts the recharts chart, which animates its draw-on. Reduced
// motion renders it instantly.
export function MarginChart() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-[240px] w-full">
      {inView && <MarginChartImpl reduced={reduced} />}
    </div>
  );
}
