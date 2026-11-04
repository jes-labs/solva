"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion";
import { registerScroller } from "@/lib/scroll-lock";
import { registerSmoothScroller } from "@/lib/scroll-to";

const REDUCED = "(prefers-reduced-motion: reduce)";

export function useSmoothScroll(): void {
  useEffect(() => {
    const query = window.matchMedia(REDUCED);
    let stop: (() => void) | null = null;

    const start = () => {
      const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.085, wheelMultiplier: 0.9 });
      const update = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
      registerScroller(lenis);
      registerSmoothScroller(lenis);
      return () => {
        registerSmoothScroller(null);
        registerScroller(null);
        gsap.ticker.remove(update);
        lenis.off("scroll", ScrollTrigger.update);
        lenis.destroy();
      };
    };

    const sync = () => {
      if (query.matches) {
        stop?.();
        stop = null;
        return;
      }
      stop ??= start();
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      stop?.();
    };
  }, []);
}
