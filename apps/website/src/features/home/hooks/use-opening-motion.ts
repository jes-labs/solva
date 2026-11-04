"use client";

import type { RefObject } from "react";
import { EASE_OUT, MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { markMotionReady } from "@/lib/motion-gate";

export function useOpeningMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      markMotionReady();
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });
        tl.set("[data-intro]", { visibility: "visible" })
          .from("[data-line]", { yPercent: 110, duration: 1, stagger: 0.1 })
          .from("[data-fade]", { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.08 }, "-=0.7");
      });
      return () => mm.revert();
    },
    { scope },
  );
}
