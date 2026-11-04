"use client";

import { useEffect, useRef, useState } from "react";
import { scrollProgress, showBackToTop } from "@/lib/scroll-progress";
import { scrollToY } from "@/lib/scroll-to";

export function useBackToTop() {
  const ring = useRef<SVGCircleElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const progress = scrollProgress(window.scrollY, root.scrollHeight, window.innerHeight);
      ring.current?.style.setProperty("stroke-dashoffset", String(1 - progress));
      setVisible(showBackToTop(window.scrollY, window.innerHeight));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function toTop() {
    scrollToY(0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  return { ring, visible, toTop };
}
