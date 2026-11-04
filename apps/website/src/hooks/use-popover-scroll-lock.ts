"use client";

import { useEffect } from "react";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

export function usePopoverScrollLock(popoverId: string): void {
  useEffect(() => {
    const panel = document.getElementById(popoverId);
    if (!panel) return;
    let locked = false;
    const onToggle = (event: Event) => {
      const open = (event as ToggleEvent).newState === "open";
      if (open && !locked) {
        locked = true;
        lockScroll();
      } else if (!open && locked) {
        locked = false;
        unlockScroll();
      }
    };
    panel.addEventListener("toggle", onToggle);
    return () => {
      panel.removeEventListener("toggle", onToggle);
      if (locked) unlockScroll();
    };
  }, [popoverId]);
}
