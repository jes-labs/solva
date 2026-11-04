"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { EASE_OUT, ScrollTrigger, gsap, useGSAP } from "@/lib/motion";
import { scrollToY } from "@/lib/scroll-to";
import { stepAt, stepOffset } from "../lib/stage-steps";

const PINNED = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function buildStage(scope: HTMLElement) {
  const q = gsap.utils.selector(scope);
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  tl.fromTo(
    q('[data-part="tree-line"]'),
    { strokeDasharray: 1, strokeDashoffset: 1 },
    { strokeDashoffset: 0, stagger: 0.035, duration: 0.45 },
    1.05,
  )
    .from(
      q('[data-part="node"]'),
      { autoAlpha: 0, scale: 0.4, transformOrigin: "center", stagger: 0.05, duration: 0.3 },
      1.35,
    )
    .from(q('[data-part="tree-caption"]'), { autoAlpha: 0, duration: 0.25 }, 1.75)
    .fromTo(
      q('[data-part="proof-line"]'),
      { strokeDasharray: 1, strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.45 },
      2.05,
    )
    .from(q('[data-part="proof-label"]'), { autoAlpha: 0, duration: 0.25 }, 2.3)
    .fromTo(
      q('[data-part="ring"] .gauge-tick'),
      { opacity: 0.4 },
      { opacity: 1, stagger: 0.012, duration: 0.15 },
      2.4,
    )
    .from(q('[data-part="bar-label"]'), { autoAlpha: 0, duration: 0.25 }, 3.05)
    .from(
      q('[data-part="bar"]'),
      { scaleX: 0, transformOrigin: "left center", stagger: 0.2, duration: 0.45, ease: EASE_OUT },
      3.1,
    )
    .from(q('[data-part="bar-mark"]'), { autoAlpha: 0, duration: 0.25 }, 3.6)
    .from(q('[data-part="record"]'), { autoAlpha: 0, y: 16, duration: 0.55, ease: EASE_OUT }, 4.05)
    .to({}, { duration: 0.4 }, 4.6);
  return tl;
}

export function useRecordStage(scope: RefObject<HTMLElement | null>, steps: number) {
  const [step, setStep] = useState(1);
  const [pinned, setPinned] = useState(false);
  const trigger = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const query = window.matchMedia(PINNED);
    const sync = () => setPinned(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useGSAP(
    () => {
      if (!pinned || !scope.current) return;
      const timeline = buildStage(scope.current);
      const q = gsap.utils.selector(scope.current);
      const intro = gsap.from(q('[data-part="leaf"], [data-part="leaves-caption"]'), {
        autoAlpha: 0,
        x: -14,
        duration: 0.6,
        ease: EASE_OUT,
        stagger: 0.06,
        scrollTrigger: { trigger: scope.current, start: "top 75%", once: true },
      });
      trigger.current = ScrollTrigger.create({
        trigger: scope.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
        animation: timeline,
        onUpdate: (self) => setStep(stepAt(self.progress, steps)),
      });
      ScrollTrigger.refresh();
      return () => {
        trigger.current?.kill();
        trigger.current = null;
        timeline.kill();
        intro.scrollTrigger?.kill();
        intro.revert();
      };
    },
    { scope, dependencies: [pinned, steps] },
  );

  function goTo(next: number) {
    const current = trigger.current;
    if (pinned && current) {
      scrollToY(current.start + stepOffset(next, steps) * (current.end - current.start));
      return;
    }
    setStep(next);
  }

  return { step, goTo, pinned };
}
