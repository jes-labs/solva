import type { ReactNode } from "react";
import type { CoverageState } from "@/lib/coverage";
import { cn } from "@/lib/utils";

const CENTER = 100;
const OUTER = 92;

type Mode =
  | { mode: "meter"; share: number; state: CoverageState }
  | { mode: "calendar"; days: readonly boolean[]; today?: number }
  | { mode: "progress"; step: number; steps: number };

interface SealInstrumentProps {
  size?: "default" | "compact";
  ticks?: number;
  className?: string;
  children?: ReactNode;
  title?: string;
}

const SIZES = {
  default: { inner: 80, longInner: 75, width: 2.2, longWidth: 3, every: 6 },
  compact: { inner: 70, longInner: 70, width: 5, longWidth: 5, every: 1 },
} as const;

function point(angle: number, radius: number) {
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    x: round(CENTER + Math.sin(angle) * radius),
    y: round(CENTER - Math.cos(angle) * radius),
  };
}

function surplusArc(extra: number) {
  const sweep = Math.min(extra, 0.5) * Math.PI * 2;
  if (sweep <= 0) return null;
  const start = point(0, 97);
  const end = point(sweep, 97);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A 97 97 0 ${large} 1 ${end.x} ${end.y}`;
}

interface TickStyle {
  className: string;
  dashed?: boolean;
}

function tickStyle(props: Mode, index: number, count: number): TickStyle {
  if (props.mode === "meter") {
    const clamped = Math.min(Math.max(props.share, 0), 1);
    const lit = props.state === "stale" ? 0 : Math.round(clamped * count);
    if (props.state === "stale") return { className: "stroke-stale-fill", dashed: true };
    if (index >= lit) return { className: "stroke-line-strong opacity-60" };
    if (props.state === "short") return { className: "stroke-short-fill" };
    return { className: index === lit - 1 ? "stroke-signal" : "stroke-text" };
  }
  if (props.mode === "calendar") {
    const day = props.days[index];
    if (index === props.today) return { className: "stroke-signal" };
    if (day === undefined) return { className: "stroke-line opacity-50" };
    return day ? { className: "stroke-text" } : { className: "stroke-line-strong", dashed: true };
  }
  const per = count / props.steps;
  const lit = Math.round(props.step * per);
  if (index >= lit) return { className: "stroke-line-strong opacity-60" };
  const current = index >= Math.round((props.step - 1) * per);
  return { className: current ? "stroke-signal" : "stroke-text" };
}

export function SealInstrument({
  size = "default",
  ticks,
  className,
  children,
  title,
  ...props
}: SealInstrumentProps & Mode) {
  const spec = SIZES[size];
  const count =
    ticks ?? (props.mode === "calendar" ? props.days.length : size === "default" ? 72 : 24);
  const arc =
    props.mode === "meter" && props.state === "covered" && size === "default"
      ? surplusArc(props.share - 1)
      : null;

  return (
    <div data-seal className={cn("@container relative aspect-square", className)}>
      <svg
        viewBox="0 0 200 200"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        className="absolute inset-0 size-full"
      >
        {title ? <title>{title}</title> : null}
        <g strokeLinecap="butt">
          {Array.from({ length: count }, (_, index) => {
            const angle = (index / count) * Math.PI * 2;
            const long = index % spec.every === 0;
            const a = point(angle, long ? spec.longInner : spec.inner);
            const b = point(angle, OUTER);
            const style = tickStyle(props, index, count);
            return (
              <line
                key={index}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={long ? spec.longWidth : spec.width}
                strokeDasharray={style.dashed ? "2 2.5" : undefined}
                className={cn("gauge-tick", style.className)}
                style={{ transitionDelay: `${index * 5}ms` }}
              />
            );
          })}
        </g>
        {arc ? (
          <path
            d={arc}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="butt"
            className="stroke-signal"
          />
        ) : null}
      </svg>
      <div className="absolute inset-[24%] flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
