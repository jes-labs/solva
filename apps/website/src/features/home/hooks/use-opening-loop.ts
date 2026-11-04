"use client";

import { useEffect, useState, type RefObject } from "react";
import { EASE_OUT, MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { nextDay } from "../lib/stage-steps";

const REDUCED = "(prefers-reduced-motion: reduce)";

export function useOpeningLoop(
  scope: RefObject<HTMLElement | null>,
  count: number,
  periodMs = 5200,
) {
  const [index, setIndex] = useState(count - 1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    const reduced = window.matchMedia(REDUCED);
    let visible = false;
    const sync = () => setRunning(visible && !reduced.matches && !document.hidden);
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [scope]);

  useEffect(() => {
    if (!running || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => nextDay(i, count)), periodMs);
    return () => window.clearInterval(id);
  }, [running, count, periodMs]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const ticks = gsap.utils.toArray<Element>("[data-hero-seal] .gauge-tick");
        const value = document.querySelector<HTMLElement>("[data-hero-value]");
        const stamp = document.querySelector<HTMLElement>("[data-hero-stamp]");
        const day = document.querySelector<HTMLElement>("[data-hero-day]");
        const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
        tl.fromTo(
          ticks,
          { opacity: 0.3 },
          {
            opacity: 1,
            duration: 0.3,
            stagger: { each: 0.01, from: "start" },
            clearProps: "opacity",
          },
          0,
        );
        if (value) {
          const target = Number(value.dataset.heroValue);
          const from = Number(value.dataset.heroFrom ?? target);
          const state = { v: Number.isFinite(from) ? from : target };
          value.dataset.heroFrom = String(target);
          tl.to(
            state,
            {
              v: target,
              duration: 0.9,
              onUpdate: () => {
                value.textContent = `${state.v.toFixed(2)}%`;
              },
            },
            0.25,
          );
        }
        if (day) tl.fromTo(day, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.3);
        if (stamp)
          tl.fromTo(stamp, { scale: 0.96 }, { scale: 1, duration: 0.5, clearProps: "scale" }, 0.6);
      });
      return () => mm.revert();
    },
    { scope, dependencies: [index] },
  );

  return index;
}
