interface Scroller {
  stop(): void;
  start(): void;
}

let scroller: Scroller | null = null;
let locks = 0;

export function registerScroller(next: Scroller | null): void {
  scroller = next;
  if (next && locks > 0) next.stop();
}

export function lockScroll(): void {
  locks += 1;
  document.documentElement.classList.add("scroll-locked");
  scroller?.stop();
}

export function unlockScroll(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.documentElement.classList.remove("scroll-locked");
  scroller?.start();
}
