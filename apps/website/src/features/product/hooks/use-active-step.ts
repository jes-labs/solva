"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeToNothing() {
  return () => undefined;
}

function canObserve() {
  return typeof IntersectionObserver !== "undefined";
}

function cannotObserveOnServer() {
  return false;
}

export function useActiveStep(count: number) {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  const isTracking = useSyncExternalStore(subscribeToNothing, canObserve, cannotObserveOnServer);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          const index = Number(entry.target.dataset.step);
          if (Number.isInteger(index) && index >= 0 && index < count) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const node of nodes.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  function register(index: number) {
    return (node: HTMLElement | null) => {
      nodes.current[index] = node;
    };
  }

  return { active, register, isTracking };
}
