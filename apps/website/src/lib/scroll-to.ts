interface SmoothScroller {
  scrollTo(target: number, options?: { duration?: number }): void;
}

let smooth: SmoothScroller | null = null;

export function registerSmoothScroller(next: SmoothScroller | null): void {
  smooth = next;
}

export function scrollToY(y: number): void {
  if (smooth) {
    smooth.scrollTo(y, { duration: 1.1 });
    return;
  }
  window.scrollTo({ top: y, behavior: "smooth" });
}
