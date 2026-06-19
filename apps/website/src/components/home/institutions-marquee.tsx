"use client";

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { institutions } from "./home-data";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

function Name({ name }: { name: string }) {
  return (
    <span className="mx-[17px] inline-flex items-center gap-[34px]">
      <span className="font-display text-[21px] font-bold tracking-tight text-sec">{name}</span>
      <span className="h-1 w-1 rounded-full bg-hair-strong" aria-hidden="true" />
    </span>
  );
}

// The institutions strip. It scrolls with react-fast-marquee, pauses on hover,
// and fades at both edges. Under reduced motion it renders a static wrapped row.
export function InstitutionsMarquee() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  if (reduced) {
    return (
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
        {institutions.map((name) => (
          <span key={name} className="font-display text-[21px] font-bold tracking-tight text-sec">
            {name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="marquee-mask">
      <Marquee gradient={false} pauseOnHover speed={45} autoFill>
        {institutions.map((name) => (
          <Name key={name} name={name} />
        ))}
      </Marquee>
    </div>
  );
}
