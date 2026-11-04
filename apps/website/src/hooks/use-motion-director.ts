"use client";

import { usePathname } from "next/navigation";
import { EASE_OUT, MOTION_OK, ScrollTrigger, gsap, useGSAP } from "@/lib/motion";
import { markMotionReady } from "@/lib/motion-gate";

const REVEAL = "[data-reveal]";
const ROWS = "[data-rows]";
const SEAL = "[data-seal]";
const COUNT = "[data-count]";
const TICKS = "[data-ticks]";
const CALENDAR = "[data-calendar]";
const DRAW = "[data-draw]";
const MARKED =
  "[data-reveal], [data-rows], [data-seal], [data-ticks], [data-calendar], [data-part], [data-draw], [data-intro]";
const AUTO_FIGURES = "main :is(figure, article, table, .ruled-marks, .ruled-grid)";
const AUTO_LISTS = "main :is(ul, ol, dl)";

function isFree(element: Element, claimed: readonly Element[]): boolean {
  if (element.closest(MARKED)) return false;
  if (element.querySelector(MARKED)) return false;
  return !claimed.some((other) => other !== element && other.contains(element));
}

function autoMark() {
  const figures: Element[] = [];
  for (const figure of document.querySelectorAll(AUTO_FIGURES)) {
    if (figure.closest("header, footer, nav, [popover]")) continue;
    if (isFree(figure, figures)) figures.push(figure);
  }
  const lists: Element[] = [];
  for (const list of document.querySelectorAll(AUTO_LISTS)) {
    if (list.children.length < 2 || list.closest("header, footer, nav, [popover]")) continue;
    if (figures.some((figure) => figure.contains(list))) continue;
    if (isFree(list, lists)) lists.push(list);
  }
  return { figures, lists };
}

function animateDrawing(svg: Element) {
  const q = gsap.utils.selector(svg);
  const rows = q('[data-draw="row"]');
  const bars = q('[data-draw="bar"]');
  const lines = q('[data-draw="line"]');
  const pops = q('[data-draw="pop"]');
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_OUT } });
  if (rows.length) tl.from(rows, { autoAlpha: 0, x: -10, duration: 0.5, stagger: 0.06 }, 0);
  if (bars.length)
    tl.from(
      bars,
      { scaleX: 0, transformOrigin: "left center", duration: 0.8, stagger: 0.06 },
      rows.length ? 0.15 : 0,
    );
  if (lines.length)
    tl.fromTo(
      lines,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.7, stagger: 0.04, ease: "power2.inOut" },
      0,
    );
  if (pops.length)
    tl.from(
      pops,
      { autoAlpha: 0, scale: 0.5, transformOrigin: "center", duration: 0.45, stagger: 0.07 },
      lines.length ? 0.45 : 0.3,
    );
  ScrollTrigger.create({ trigger: svg, start: "top 85%", once: true, onEnter: () => tl.play() });
}

function revealBatch(targets: Element[]) {
  gsap.to(targets, {
    autoAlpha: 1,
    y: 0,
    duration: 0.9,
    ease: EASE_OUT,
    stagger: 0.08,
    overwrite: true,
  });
}

function countUp(element: HTMLElement) {
  const text = element.dataset.countText ?? element.textContent ?? "";
  element.dataset.countText = text;
  const match = /^([\d,]+)(?:\.(\d+))?(.*)$/.exec(text.trim());
  if (!match) return;
  const [, whole, fraction = "", suffix = ""] = match;
  const target = Number(`${whole.replace(/,/g, "")}.${fraction || "0"}`);
  if (!Number.isFinite(target) || target === 0) return;
  const decimals = fraction.length;
  const state = { value: 0 };
  gsap.to(state, {
    value: target,
    duration: 1.4,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = `${state.value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    },
    onComplete: () => {
      element.textContent = text;
    },
    onInterrupt: () => {
      element.textContent = text;
    },
  });
}

function animateCalendar(svg: Element) {
  const ticks = gsap.utils.toArray<SVGLineElement>("line", svg);
  if (ticks.length === 0) return;
  const figure = svg.closest("figure") ?? svg.parentElement;
  const outputs = {
    day: figure?.querySelector<HTMLElement>("[data-cal-day]") ?? null,
    proofs: figure?.querySelector<HTMLElement>("[data-cal-proofs]") ?? null,
    missed: figure?.querySelector<HTMLElement>("[data-cal-missed]") ?? null,
  };
  const write = (day: number, proofs: number, missed: number) => {
    if (outputs.day) outputs.day.textContent = String(day);
    if (outputs.proofs) outputs.proofs.textContent = String(proofs);
    if (outputs.missed) outputs.missed.textContent = String(missed);
  };
  const restore = () => {
    for (const out of Object.values(outputs)) {
      if (out)
        out.textContent =
          out.dataset.calDay ?? out.dataset.calProofs ?? out.dataset.calMissed ?? "";
    }
  };
  const base = ticks.map((tick) => Number(tick.dataset.base ?? 1));
  const missedBefore: number[] = [];
  let missedSoFar = 0;
  for (const tick of ticks) {
    missedBefore.push(missedSoFar);
    if (tick.dataset.day === "missed") missedSoFar += 1;
  }

  gsap.set(ticks, { opacity: 0, scaleY: 0.2, transformOrigin: "50% 100%" });
  write(0, 0, 0);
  const counter = { day: 0 };
  const intro = gsap.timeline({ paused: true, onComplete: restore });
  intro.to(
    ticks,
    {
      opacity: (index: number) => base[index] ?? 1,
      scaleY: 1,
      duration: 0.35,
      ease: EASE_OUT,
      stagger: { amount: 2.2, from: "start" },
    },
    0,
  );
  intro.to(
    counter,
    {
      day: ticks.length,
      duration: 2.55,
      ease: "none",
      onUpdate: () => {
        const day = Math.round(counter.day);
        const missed = day >= ticks.length ? missedSoFar : (missedBefore[day] ?? 0);
        write(day, day - missed, missed);
      },
    },
    0,
  );

  const proofTicks = ticks.filter((tick) => tick.dataset.day === "proof");
  const sweep = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.6 });
  sweep.to(
    proofTicks,
    {
      keyframes: [
        { opacity: 0.9, duration: 0.15 },
        { opacity: 0.22, duration: 0.55 },
      ],
      ease: "none",
      stagger: { amount: 1.8, from: "start" },
    },
    0,
  );

  ScrollTrigger.create({
    trigger: svg,
    start: "top 90%",
    end: "bottom top",
    onEnter: () => {
      if (intro.progress() === 0) intro.play();
      else if (intro.progress() === 1) sweep.play();
    },
    onLeave: () => sweep.pause(),
    onEnterBack: () => {
      if (intro.progress() === 1) sweep.play();
    },
    onLeaveBack: () => sweep.pause(),
  });
  intro.eventCallback("onComplete", () => {
    restore();
    sweep.play();
  });
  return restore;
}

export function useMotionDirector() {
  const pathname = usePathname();

  useGSAP(
    () => {
      markMotionReady();
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "main",
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE_OUT },
        );
        const auto = autoMark();
        gsap.set(REVEAL, { autoAlpha: 0, y: 22 });
        if (auto.figures.length) {
          gsap.set(auto.figures, { autoAlpha: 0, y: 22 });
          ScrollTrigger.batch(auto.figures, {
            start: "top 92%",
            once: true,
            onEnter: revealBatch,
          });
        }
        for (const list of auto.lists) {
          const rows = [...list.children];
          gsap.set(rows, { autoAlpha: 0, y: 12 });
          ScrollTrigger.create({
            trigger: list,
            start: "top 90%",
            once: true,
            onEnter: () =>
              gsap.to(rows, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE_OUT, stagger: 0.05 }),
          });
        }
        const drawings = new Set<Element>();
        for (const mark of document.querySelectorAll(DRAW)) {
          const svg = mark.closest("svg");
          if (svg) drawings.add(svg);
        }
        for (const svg of drawings) animateDrawing(svg);

        ScrollTrigger.batch(REVEAL, {
          start: "top 92%",
          once: true,
          onEnter: revealBatch,
        });

        for (const list of document.querySelectorAll(ROWS)) {
          const rows = [...list.children];
          if (rows.length === 0) continue;
          gsap.set(rows, { autoAlpha: 0, y: 14 });
          ScrollTrigger.create({
            trigger: list,
            start: "top 90%",
            once: true,
            onEnter: () =>
              gsap.to(rows, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.06 }),
          });
        }

        for (const strip of document.querySelectorAll(TICKS)) {
          const ticks = [...strip.children];
          if (ticks.length === 0) continue;
          gsap.set(ticks, { opacity: 0, scaleY: 0.2, transformOrigin: "50% 100%" });
          ScrollTrigger.create({
            trigger: strip,
            start: "top 90%",
            once: true,
            onEnter: () =>
              gsap.to(ticks, {
                opacity: 1,
                scaleY: 1,
                duration: 0.45,
                ease: EASE_OUT,
                stagger: { amount: Math.min(0.9, ticks.length * 0.008), from: "start" },
                clearProps: "opacity,transform",
              }),
          });
        }

        for (const seal of document.querySelectorAll(SEAL)) {
          const ticks = seal.querySelectorAll(".gauge-tick");
          const count = seal.querySelector<HTMLElement>(COUNT);
          gsap.set(ticks, { opacity: 0, scale: 0.4, transformOrigin: "center" });
          ScrollTrigger.create({
            trigger: seal,
            start: "top 88%",
            once: true,
            onEnter: () => {
              gsap.to(ticks, {
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: EASE_OUT,
                stagger: { amount: Math.min(1.2, ticks.length * 0.012), from: "start" },
                clearProps: "opacity,scale,transform",
              });
              if (count) countUp(count);
            },
          });
        }

        for (const count of document.querySelectorAll<HTMLElement>(COUNT)) {
          if (count.closest(SEAL)) continue;
          ScrollTrigger.create({
            trigger: count,
            start: "top 90%",
            once: true,
            onEnter: () => countUp(count),
          });
        }

        const restores: (() => void)[] = [];
        for (const calendar of document.querySelectorAll(CALENDAR)) {
          const restore = animateCalendar(calendar);
          if (restore) restores.push(restore);
        }

        ScrollTrigger.refresh();
        return () => {
          for (const restore of restores) restore();
        };
      });
      return () => mm.revert();
    },
    { dependencies: [pathname] },
  );
}
