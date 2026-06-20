"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import { useTheme } from "@/components/theme-provider";

const ACCENT = "#CFE524";
const DOT_ON_DARK = "#F5F6EE";
const DOT_ON_LIGHT = "#0A0C06";

// The hero is pinned with CSS sticky over PIN_VH viewports of scroll. GSAP drives
// the motion across that range: the dots assemble, then the layers parallax at
// different speeds while the next section slides up and overlays the hero.
const PIN_VH = 1.8;
// Assembly completes at this share of the pinned scroll; the rest is the parallax
// recede and overlay handoff.
const ASSEMBLE_END = 0.42;
const HEADLINE_RISE = 0.16;
const WORD_Y = 0.58;
const EYEBROW_RATIO = 0.2;
const EYEBROW_MIN = 16;

const targetHeadlineSize = () => Math.max(34, Math.min(window.innerWidth * 0.05, 64));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface Particle {
  hx: number;
  hy: number;
  tx: number;
  ty: number;
  amp: number;
  driftPhase: number;
  driftSpeed: number;
  twPhase: number;
  twSpeed: number;
}

// The Solva particle hero. The dots drift and twinkle like a slow sky, then
// settle into "Solva" as the section is pinned and scrubbed. Once the word is
// formed the layers parallax (dots slow, text faster) and the rest of the page
// slides up to overlay the receding hero. The assembly is the Merkle sum
// commitment made visible.
export function ParticleHero() {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const headlineTextRef = useRef<HTMLSpanElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const redrawRef = useRef<(() => void) | null>(null);

  useGSAP(() => {
    const hero = heroRef.current;
    const content = contentRef.current;
    const canvas = canvasRef.current;
    const group = groupRef.current;
    const headline = headlineRef.current;
    const ctx = canvas?.getContext("2d");
    if (!hero || !content || !canvas || !group || !headline || !ctx) {
      return;
    }

    const reduce = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = () => window.innerWidth < 768;
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    let light: Particle[] = [];
    let accent: Particle[] = [];
    let baseFitSize = 0;
    let width = 0;
    let height = 0;
    // Eased assembly amount, written by the ScrollTrigger, read by the canvas loop.
    let assemble = reduce ? 1 : 0;
    let visible = true;
    let killed = false;
    let raf = 0;

    const fontFamily = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() ||
      "'Bricolage Grotesque', sans-serif";

    const fitHeadline = () => {
      const text = headlineTextRef.current;
      if (!text) {
        return;
      }
      const gutter = Math.max(20, hero.clientWidth * 0.035);
      const available = hero.clientWidth - gutter * 2;
      headline.style.fontSize = "100px";
      const natural = text.getBoundingClientRect().width;
      if (natural <= 0) {
        return;
      }
      let size = (available / natural) * 100;
      if (hero.clientWidth >= 1024) {
        size = Math.min(size, 132);
      }
      baseFitSize = size;
      headline.style.fontSize = `${size}px`;
    };

    // Size the headline and eyebrow for the given assembly amount.
    const sizeHeadline = (a: number) => {
      const finalSize = baseFitSize > 0 ? Math.min(targetHeadlineSize(), baseFitSize) : targetHeadlineSize();
      const size = baseFitSize > 0 ? baseFitSize + (finalSize - baseFitSize) * a : finalSize;
      headline.style.fontSize = `${size}px`;
      if (eyebrowRef.current) {
        eyebrowRef.current.style.fontSize = `${Math.max(EYEBROW_MIN, size * EYEBROW_RATIO)}px`;
      }
    };

    const sampleWord = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.floor(width);
      off.height = Math.floor(height);
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) {
        return;
      }
      const fontSize = Math.min(width * 0.26, height * 0.3, 300);
      octx.fillStyle = "#fff";
      octx.font = `700 ${fontSize}px ${fontFamily()}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText("Solva", width / 2, height * WORD_Y);
      const data = octx.getImageData(0, 0, off.width, off.height).data;

      const cap = isMobile() ? 1300 : 3600;
      const gap = 4;
      const targets: Array<[number, number]> = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (data[(y * off.width + x) * 4 + 3]! > 128) {
            targets.push([x, y]);
          }
        }
      }

      light = [];
      accent = [];
      const stride = targets.length > cap ? targets.length / cap : 1;
      const count = Math.min(targets.length, cap);
      for (let i = 0; i < count; i++) {
        const target = targets[Math.floor(i * stride)]!;
        const particle: Particle = {
          hx: Math.random() * width,
          hy: Math.random() * height,
          tx: target[0],
          ty: target[1],
          amp: rand(5, 16),
          driftPhase: rand(0, Math.PI * 2),
          driftSpeed: rand(0.25, 0.8),
          twPhase: rand(0, Math.PI * 2),
          twSpeed: rand(1, 3),
        };
        if (i % 7 === 0) {
          accent.push(particle);
        } else {
          light.push(particle);
        }
      }
    };

    const drawGroup = (set: Particle[], color: string, t: number, a: number, size: number) => {
      ctx.fillStyle = color;
      const driftScale = 1 - a;
      for (let i = 0; i < set.length; i++) {
        const p = set[i]!;
        const sx = p.hx + p.amp * Math.sin(t * p.driftSpeed + p.driftPhase) * driftScale;
        const sy = p.hy + p.amp * Math.cos(t * p.driftSpeed * 0.85 + p.driftPhase) * driftScale;
        const x = sx + (p.tx - sx) * a;
        const y = sy + (p.ty - sy) * a;
        const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * p.twSpeed + p.twPhase));
        ctx.globalAlpha = twinkle + (1 - twinkle) * a;
        ctx.fillRect(x, y, size, size);
      }
    };

    const renderFrame = (now: number) => {
      const size = isMobile() ? 1.7 : 2;
      ctx.clearRect(0, 0, width, height);
      drawGroup(light, themeRef.current === "light" ? DOT_ON_LIGHT : DOT_ON_DARK, now * 0.001, assemble, size);
      drawGroup(accent, ACCENT, now * 0.001, assemble, size);
      ctx.globalAlpha = 1;
    };
    redrawRef.current = () => renderFrame(performance.now());

    fitHeadline();
    sampleWord();
    sizeHeadline(assemble);
    gsap.set(group, { yPercent: -50 });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!killed) {
          fitHeadline();
          sampleWord();
          sizeHeadline(assemble);
        }
      });
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        fitHeadline();
        sampleWord();
        sizeHeadline(assemble);
        redrawRef.current?.();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(hero);

    let trigger: ScrollTrigger | undefined;

    if (reduce) {
      sizeHeadline(1);
      renderFrame(0);
      if (sublineRef.current) {
        sublineRef.current.style.opacity = "1";
      }
    } else {
      const loop = (now: number) => {
        if (visible) {
          renderFrame(now);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const ease = gsap.parseEase("power3.out");

      trigger = ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: () => `+=${window.innerHeight * PIN_VH}`,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const rawAssemble = clamp(p / ASSEMBLE_END, 0, 1);
          assemble = ease(rawAssemble);
          sizeHeadline(assemble);

          if (sublineRef.current) {
            sublineRef.current.style.opacity = String(clamp((rawAssemble - 0.75) / 0.25, 0, 1));
          }

          // Parallax handoff: as the next section slides up, the layers move at
          // different speeds and the hero recedes.
          const cover = clamp((p - ASSEMBLE_END) / (1 - ASSEMBLE_END), 0, 1);
          const vh = window.innerHeight;
          // Headline and word: the front layer, raised then drifting up faster.
          gsap.set(group, {
            yPercent: -50,
            y: -(HEADLINE_RISE * assemble + 0.16 * cover) * vh,
          });
          // Dot field: the back layer, drifting up slowly.
          gsap.set(canvas, { yPercent: -7 * cover });
          // The whole hero recedes and fades as the overlay covers it.
          gsap.set(content, { scale: 1 - 0.06 * cover, autoAlpha: 1 - 0.4 * cover });
        },
      });
    }

    return () => {
      killed = true;
      redrawRef.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      io.disconnect();
      trigger?.kill();
    };
  }, { scope: heroRef, dependencies: [] });

  useEffect(() => {
    redrawRef.current?.();
  }, [theme]);

  return (
    <>
      <section ref={heroRef} className="sticky top-0 z-0 h-screen overflow-hidden bg-bg">
        <h1 className="sr-only">ZK proof of reserves: prove true solvency on Solva</h1>
        <div ref={contentRef} className="absolute inset-0">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
          <div
            ref={groupRef}
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 flex flex-col items-center gap-3 px-6"
            style={{ willChange: "transform" }}
          >
            <p
              ref={eyebrowRef}
              className="hero-eyebrow font-mono text-[clamp(16px,4vw,26px)] uppercase leading-none tracking-[0.22em]"
            >
              ZK Proof of Reserves
            </p>
            <p
              ref={headlineRef}
              className="hero-headline whitespace-nowrap text-center font-display text-[clamp(2rem,9vw,8rem)] font-bold capitalize leading-[0.9] tracking-[-0.04em]"
            >
              <span ref={headlineTextRef} className="inline-block whitespace-nowrap">
                Prove true solvency
              </span>
            </p>
          </div>
          <p
            ref={sublineRef}
            aria-hidden="true"
            className="absolute inset-x-0 top-[84%] px-7 text-center font-mono text-[13px] opacity-0"
            style={{ color: "#8A9079" }}
          >
            <span style={{ color: ACCENT }}>verified</span> on Stellar, without exposing a single
            balance.
          </p>
        </div>
      </section>
      {/* Solo scroll: the hero stays pinned and assembles before the next section
          starts to overlay it. */}
      <div className="h-[80vh]" aria-hidden="true" />
    </>
  );
}
