export const MARK_PATH = "M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80";

export interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const CENTER = 60;
const OUTER = 55;
const SHORT_INNER = 47;
const LONG_INNER = 43;

function tickAt(degrees: number, inner: number): Tick {
  const radians = (degrees * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    x1: round(CENTER + dx * inner),
    y1: round(CENTER + dy * inner),
    x2: round(CENTER + dx * OUTER),
    y2: round(CENTER + dy * OUTER),
  };
}

export const SHORT_TICKS: readonly Tick[] = Array.from({ length: 36 }, (_, i) =>
  tickAt(i * 10, SHORT_INNER),
);

export const LONG_TICKS: readonly Tick[] = Array.from({ length: 12 }, (_, i) =>
  tickAt(i * 30, LONG_INNER),
);

export const MARK_TRANSFORM = "translate(60,60) scale(0.7179) translate(-50.5,-50)";
