"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  // Delay before the reveal starts, in seconds. Use to stagger siblings.
  delay?: number;
  // Distance the element rises from, in pixels.
  y?: number;
}

// Fades and lifts its content into view when it scrolls near the viewport. The
// content renders visible by default, so it is readable with no JavaScript. The
// hidden start state is set in a layout effect before paint, so there is no
// flash. Under reduced motion the content is simply left in place.
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        return;
      }
      gsap.set(ref.current, { opacity: 0, y });
      gsap.to(ref.current, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
