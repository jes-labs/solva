"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import { Button, Card, Eyebrow, CheckIcon } from "@/components/ui";
import { segments, type Segment } from "./solutions-data";

const sectionX = "mx-auto max-w-site px-7";

// The segmented hub. The tabs switch the active segment and the body fades in
// with GSAP on each change, the one motion the design specifies here.
export function SolutionsTabs() {
  const [active, setActive] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const segment = segments[active] ?? segments[0]!;

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        return;
      }
      gsap.fromTo(
        bodyRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
      );
    },
    { dependencies: [active], scope: bodyRef },
  );

  return (
    <>
      <div className={sectionX}>
        <div
          role="tablist"
          aria-label="Solutions by segment"
          className="flex w-fit max-w-full flex-wrap gap-2 rounded-[12px] border border-hair bg-surface p-1.5"
        >
          {segments.map((s, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={s.label}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(idx)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? "bg-acc text-on-acc" : "text-sec hover:text-fg"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={bodyRef}>
        <SegmentBody segment={segment} />
      </div>
    </>
  );
}

function SegmentBody({ segment }: { segment: Segment }) {
  return (
    <>
      {/* Segment hero */}
      <section className={`${sectionX} pb-5 pt-10`}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="mb-3.5 font-mono text-xs text-sec">{segment.kicker}</p>
            <h2 className="h2">{segment.title}</h2>
            <p className="mt-4 max-w-[480px] text-[17px] leading-relaxed text-sec">{segment.sub}</p>
            <div className="mt-6">
              <Button href="/request-a-demo">{segment.cta}</Button>
            </div>
          </div>
          <Card className="p-7">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
              {segment.statLabel}
            </p>
            <div className="flex flex-col gap-[18px]">
              {segment.stats.map((stat) => (
                <div
                  key={stat.k}
                  className="flex items-baseline justify-between gap-3.5 border-b border-hair pb-3.5"
                >
                  <span className="max-w-[60%] text-sm text-sec">{stat.k}</span>
                  <span className={`font-mono text-xl ${stat.accent ? "text-acc-text" : "text-fg"}`}>
                    {stat.v}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* The problem */}
      <section className={`${sectionX} py-10`}>
        <div className="grid grid-cols-1 gap-12 border-t border-hair pt-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Eyebrow className="mb-4 text-acc-text">The problem</Eyebrow>
            <h3 className="font-display text-[clamp(24px,2.8vw,34px)] font-semibold leading-tight tracking-tight">
              {segment.probTitle}
            </h3>
          </div>
          <p className="self-center text-[16.5px] leading-relaxed text-sec">{segment.probBody}</p>
        </div>
      </section>

      {/* How Solva fits */}
      <section className={`${sectionX} pb-10 pt-2`}>
        <h3 className="mb-7 font-display text-[clamp(22px,2.6vw,32px)] font-semibold tracking-tight">
          How Solva fits
        </h3>
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {segment.fits.map((fit) => (
            <Card key={fit.n} className="h-full p-7">
              <div className="mb-3.5 font-mono text-[13px] text-acc-text">{fit.n}</div>
              <h4 className="font-display text-[18px] font-semibold tracking-tight">{fit.h}</h4>
              <p className="mt-2 text-[14.5px] leading-snug text-sec">{fit.b}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Outcomes + integration */}
      <section className={`${sectionX} pb-12 pt-2`}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h3 className="mb-5 font-display text-[clamp(22px,2.6vw,30px)] font-semibold tracking-tight">
              Outcomes
            </h3>
            <div className="flex flex-col gap-3.5">
              {segment.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-3">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-acc-text" />
                  <span className="text-base leading-snug text-fg">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-5 font-display text-[clamp(22px,2.6vw,30px)] font-semibold tracking-tight">
              Integration
            </h3>
            <div className="border-b border-hair">
              {segment.integration.map((step) => (
                <div key={step.n} className="flex gap-4 border-t border-hair py-4">
                  <span className="shrink-0 pt-0.5 font-mono text-[13px] text-acc-text">{step.n}</span>
                  <span className="text-[15px] leading-snug text-sec">{step.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
