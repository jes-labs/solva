import { cn } from "@/lib/cn";

// A deterministic identicon in the Ethereum "blockies" style, rendered as inline
// SVG. The pattern and palette are derived purely from the seed, so the same
// author always gets the same avatar, and because it is plain SVG it renders in
// server and client components alike with no canvas and no hydration gap.

// A small, fast, well-behaved PRNG (xfnv1a hash seeding mulberry32) so the same
// name always produces the same stream of values.
function makeRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  let a = h >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A vivid foreground tone that reads on the dark UI.
function foreground(rand: () => number): string {
  const hue = Math.floor(rand() * 360);
  const sat = Math.floor(rand() * 45) + 50;
  const light = Math.floor(rand() * 22) + 50;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

// A deep, muted tone for the cells that stay in the background.
function background(rand: () => number): string {
  const hue = Math.floor(rand() * 360);
  const sat = Math.floor(rand() * 25) + 15;
  const light = Math.floor(rand() * 10) + 14;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

const GRID = 8;
const HALF = GRID / 2;

interface Cell {
  x: number;
  y: number;
  fill: string;
}

function buildBlockie(seed: string): { bg: string; cells: Cell[] } {
  const rand = makeRng(seed);
  // Consume the colors first so the grid pattern that follows is stable.
  const color = foreground(rand);
  const bg = background(rand);
  const spot = foreground(rand);

  const cells: Cell[] = [];
  for (let y = 0; y < GRID; y++) {
    // Generate the left half and mirror it for the classic symmetric look.
    const half: number[] = [];
    for (let x = 0; x < HALF; x++) {
      half.push(Math.floor(rand() * 2.3));
    }
    const row = [...half, ...[...half].reverse()];
    row.forEach((value, x) => {
      if (value > 0) cells.push({ x, y, fill: value === 1 ? color : spot });
    });
  }
  return { bg, cells };
}

export function Blockie({ seed, size = 40 }: { seed: string; size?: number }) {
  const { bg, cells } = buildBlockie(seed);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={GRID} height={GRID} fill={bg} />
      {cells.map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={1} height={1} fill={cell.fill} />
      ))}
    </svg>
  );
}

// Wraps the blockie in a circular, hairline-bordered frame, seeded from the
// author's name. Drop-in replacement for the flat avatar placeholder.
export function AuthorAvatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 overflow-hidden rounded-full border border-hair", className)}
      style={{ width: size, height: size }}
    >
      <Blockie seed={name.trim().toLowerCase()} size={size} />
    </span>
  );
}
