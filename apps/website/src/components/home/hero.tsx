"use client";

import { useEffect, useState } from "react";
import { Button, ArrowRightIcon } from "@/components/ui";
import { ProofSeal } from "./proof-seal";
import { proofHashes } from "./home-data";

// The hero. It runs a one-second live-proof loop: the "Xs ago" label ticks, and
// every six seconds a new proof lands, which rotates the hash chip and fires the
// seal pulse.
export function Hero() {
  const [secs, setSecs] = useState(0);
  const [hashIndex, setHashIndex] = useState(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= 6) {
          setHashIndex((h) => (h + 1) % proofHashes.length);
          setBeat((b) => b + 1);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ago = secs < 2 ? "just now" : `${secs}s ago`;
  const hash = proofHashes[hashIndex] ?? proofHashes[0];

  return (
    <header className="mx-auto grid max-w-site grid-cols-1 items-center gap-12 px-7 pb-24 pt-40 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <h2 className="h1">
          Prove true <span className="accent-word">solvency</span>, without revealing a thing.
        </h2>
        <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-sec">
          Solva continuously proves your reserves meet or exceed your liabilities. Every result is
          verified on-chain on Stellar, and customer data never leaves your perimeter.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <Button href="/request-a-demo">Request a demo</Button>
          <Button variant="secondary" href="/developers">
            Read the docs
            <ArrowRightIcon size={15} />
          </Button>
        </div>
        <div className="mt-8 inline-flex items-center gap-3 font-mono text-[13px] text-sec">
          <span
            className="h-2.5 w-2.5 rounded-full bg-acc"
            style={{ boxShadow: "0 0 12px 1px var(--acc)" }}
            aria-hidden="true"
          />
          <span>
            <span className="font-medium text-fg">Solvent</span>{" "}
            <span className="text-acc-text">✓</span> verified on Stellar <span>{ago}</span>
          </span>
        </div>
      </div>

      <div className="relative aspect-square w-full max-w-[480px] justify-self-center lg:justify-self-end">
        <ProofSeal beatSignal={beat} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="24 11 53 78" className="w-[78px]" aria-hidden="true">
            <path
              d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
              fill="none"
              stroke="var(--acc)"
              strokeWidth="14"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div
          className="absolute bottom-[6%] left-1/2 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-pill border border-hair px-[15px] py-2 font-mono text-[11.5px] backdrop-blur-sm"
          style={{ background: "color-mix(in oklab, var(--surface) 86%, transparent)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-acc" aria-hidden="true" />
          <span className="text-sec">proof</span>
          <span className="text-fg">{hash}</span>
          <span className="text-acc-text">✓ R ≥ L</span>
        </div>
      </div>
    </header>
  );
}
