"use client";

import { useEffect, useState } from "react";

export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join(" ");

  useEffect(() => {
    const targets = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const first = targets.find((target) => visible.has(target.id));
        if (first) {
          setActive(first.id);
        }
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );

    for (const target of targets) {
      observer.observe(target);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}
