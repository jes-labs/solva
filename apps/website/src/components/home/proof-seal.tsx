"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

// The generative seal: a tick ring, concentric rings, a counter-rotating dashed
// dial, a sweeping scan line, and a pulse ring that fires when a new proof lands.
// It reads the brand variables, so it follows the theme. Under reduced motion it
// draws a single still frame.
export function ProofSeal({ beatSignal }: { beatSignal: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRef = useRef(-9999);

  // Record when a new proof arrives so the next frames can draw the pulse.
  useEffect(() => {
    beatRef.current = performance.now();
  }, [beatSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const reduce = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const root = document.documentElement;
    const cssVar = (name: string, fallback: string) =>
      getComputedStyle(root).getPropertyValue(name).trim() || fallback;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const R = Math.min(w, h) * 0.46;
      const accent = cssVar("--acc", "#cfe524");
      const hair = cssVar("--hair-strong", "#3c4429");

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const slow = reduce ? 0 : t * 0.00006;

      // Outer tick ring.
      ctx.strokeStyle = hair;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = dpr;
      const ticks = 72;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2 + slow;
        const long = i % 6 === 0;
        const r1 = R * (long ? 0.86 : 0.9);
        const r2 = R * 0.94;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }

      // Concentric rings.
      ctx.globalAlpha = 0.5;
      [0.94, 0.66, 0.42].forEach((k) => {
        ctx.beginPath();
        ctx.arc(0, 0, R * k, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Counter-rotating dashed dial.
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.2 * dpr;
      ctx.save();
      ctx.rotate(-slow * 2);
      ctx.setLineDash([4 * dpr, 7 * dpr]);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);

      // Scan sweep.
      if (!reduce) {
        ctx.save();
        ctx.rotate(t * 0.0011);
        const grad = ctx.createLinearGradient(0, 0, R * 0.94, 0);
        grad.addColorStop(0, "rgba(207,229,36,0)");
        grad.addColorStop(1, accent);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(R * 0.9, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Verified pulse ring, fired on each new proof.
      const since = t - beatRef.current;
      if (since < 1400) {
        const p = since / 1400;
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.arc(0, 0, R * (0.66 + p * 0.25), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      if (!reduce) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
