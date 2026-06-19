"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import { Eyebrow } from "@/components/ui";
import { pipelineSteps } from "./home-data";

// The four-step pipeline. The left rail stays pinned with CSS sticky. As each
// step scrolls through the middle of the viewport, its border lights up and its
// progress bar fills, tracked with ScrollTrigger. Reduced motion leaves it
// static.
export function Pipeline() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        return;
      }
      const steps = gsap.utils.toArray<HTMLElement>(".sv-step");
      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => {
            const fill = ref.current?.querySelector<HTMLElement>(`.sv-pipe-fill[data-i="${i}"]`);
            if (fill) {
              gsap.to(fill, { width: self.isActive ? "100%" : "0%", duration: 0.4 });
            }
            gsap.to(step, {
              borderColor: self.isActive ? "var(--acc-text)" : "var(--hair)",
              duration: 0.3,
            });
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section id="how" ref={ref} className="relative z-[1]">
      <div className="mx-auto max-w-site px-7 py-10">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div className="lg:sticky lg:top-[140px]">
            <Eyebrow className="mb-4 text-acc-text">How it works</Eyebrow>
            <h2 className="h2">Four steps, end&#8209;to&#8209;end.</h2>
            <p className="mt-5 max-w-[340px] text-[16.5px] leading-relaxed text-sec">
              From raw ledger to an on-chain proof anyone can verify. Your data never leaves the
              building.
            </p>
            <div className="mt-7 flex gap-2">
              {pipelineSteps.map((step) => (
                <span key={step.num} className="h-[3px] flex-1 overflow-hidden rounded-sm bg-hair">
                  <span
                    className="sv-pipe-fill block h-full w-0 bg-acc"
                    data-i={pipelineSteps.indexOf(step)}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            {pipelineSteps.map((step, i) => (
              <div
                key={step.title}
                className="sv-step rounded-card border border-hair bg-surface p-7"
                data-i={i}
              >
                <div className="mb-3.5 flex items-center justify-between font-mono text-xs">
                  <span className="text-acc-text">{step.num}</span>
                  <span className="text-sec">{step.tag}</span>
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-sec">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
