export function stepAt(progress: number, steps: number): number {
  return Math.min(steps, Math.max(1, Math.floor(progress * steps) + 1));
}

export function stepOffset(step: number, steps: number): number {
  return (step - 1 + 0.45) / steps;
}

export function nextDay(index: number, count: number): number {
  if (count <= 0) return 0;
  return (index + 1) % count;
}
