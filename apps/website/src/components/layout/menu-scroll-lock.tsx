"use client";

import { usePopoverScrollLock } from "@/hooks/use-popover-scroll-lock";

export function MenuScrollLock({ popoverId }: { popoverId: string }) {
  usePopoverScrollLock(popoverId);
  return null;
}
