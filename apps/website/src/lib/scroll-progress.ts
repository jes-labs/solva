export function scrollProgress(scrollY: number, scrollHeight: number, viewport: number): number {
  const range = scrollHeight - viewport;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / range));
}

export function showBackToTop(scrollY: number, viewport: number): boolean {
  return scrollY > viewport * 0.8;
}
