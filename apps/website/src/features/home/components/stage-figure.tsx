import { cn } from "@/lib/utils";

const LEAVES = 8;
const LEAF_X = 24;
const LEAF_W = 96;
const LEAF_TOP = 48;
const LEAF_GAP = 38;
const L1_X = 196;
const L2_X = 272;
const ROOT_X = 348;
const RING_X = 476;
const RING_Y = 150;
const RING_R = 46;
const TICKS = 36;

function leafY(index: number) {
  return LEAF_TOP + index * LEAF_GAP;
}

function pairY(a: number, b: number) {
  return (leafY(a) + leafY(b)) / 2;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

const L1 = [0, 2, 4, 6].map((i) => pairY(i, i + 1));
const L2 = [pairY(0, 3), pairY(4, 7)];
const ROOT_Y = pairY(0, 7);

interface StageFigureProps {
  step: number;
  scrub?: boolean;
  className?: string;
}

export function StageFigure({ step, scrub = false, className }: StageFigureProps) {
  const at = (n: number) => step >= n;
  const part = (n: number, extra?: string) =>
    scrub ? extra : cn("stage-part", extra, at(n) ? "stage-on" : "stage-off");

  return (
    <svg
      viewBox="0 0 640 360"
      role="img"
      aria-label={`How a record is made, step ${step} of 5`}
      className={cn("h-auto w-full font-mono", scrub && "stage-scrub", className)}
      data-step={step}
    >
      <g className={part(1)}>
        {Array.from({ length: LEAVES }, (_, i) => (
          <g
            key={i}
            data-part="leaf"
            style={scrub ? undefined : { transitionDelay: `${i * 40}ms` }}
            className={scrub ? undefined : "stage-part"}
          >
            <rect
              x={LEAF_X}
              y={leafY(i) - 9}
              width={LEAF_W}
              height={18}
              className="fill-raised stroke-line"
            />
            <text x={LEAF_X + 8} y={leafY(i) + 4} fontSize={10.5} className="fill-sec">
              {`cust-${String(i + 1).padStart(3, "0")}`}
            </text>
            <rect
              x={LEAF_X + 60}
              y={leafY(i) - 4}
              width={14 + ((i * 7) % 18)}
              height={8}
              className="fill-text"
              opacity={0.35}
            />
          </g>
        ))}
        <text
          data-part="leaves-caption"
          x={LEAF_X}
          y={leafY(LEAVES - 1) + 30}
          fontSize={10.5}
          className="fill-faint"
        >
          BALANCES · PRIVATE
        </text>
      </g>

      <g className={part(2, "stage-lines")} fill="none">
        {Array.from({ length: LEAVES }, (_, i) => (
          <path
            key={i}
            data-part="tree-line"
            pathLength={1}
            d={`M ${LEAF_X + LEAF_W} ${leafY(i)} C ${LEAF_X + LEAF_W + 36} ${leafY(i)}, ${L1_X - 36} ${L1[Math.floor(i / 2)]}, ${L1_X - 6} ${L1[Math.floor(i / 2)]}`}
            className="stroke-line-strong"
            strokeWidth={1}
          />
        ))}
        {L1.map((y, i) => (
          <path
            key={`l1-${i}`}
            data-part="tree-line"
            pathLength={1}
            d={`M ${L1_X + 6} ${y} C ${L1_X + 36} ${y}, ${L2_X - 36} ${L2[Math.floor(i / 2)]}, ${L2_X - 6} ${L2[Math.floor(i / 2)]}`}
            className="stroke-line-strong"
            strokeWidth={1}
          />
        ))}
        {L2.map((y, i) => (
          <path
            key={`l2-${i}`}
            data-part="tree-line"
            pathLength={1}
            d={`M ${L2_X + 6} ${y} C ${L2_X + 36} ${y}, ${ROOT_X - 36} ${ROOT_Y}, ${ROOT_X - 7} ${ROOT_Y}`}
            className="stroke-line-strong"
            strokeWidth={1}
          />
        ))}
        {L1.map((y, i) => (
          <rect
            key={`n1-${i}`}
            data-part="node"
            x={L1_X - 6}
            y={y - 6}
            width={12}
            height={12}
            className="fill-bg stroke-text"
          />
        ))}
        {L2.map((y, i) => (
          <rect
            key={`n2-${i}`}
            data-part="node"
            x={L2_X - 6}
            y={y - 6}
            width={12}
            height={12}
            className="fill-bg stroke-text"
          />
        ))}
        <rect
          data-part="node"
          x={ROOT_X - 7}
          y={ROOT_Y - 7}
          width={14}
          height={14}
          className="fill-text"
        />
        <text
          data-part="tree-caption"
          x={L2_X - 6}
          y={leafY(LEAVES - 1) + 30}
          fontSize={10.5}
          className="fill-faint"
        >
          ONE COMMITMENT
        </text>
      </g>

      <g className={part(3)}>
        <path
          data-part="proof-line"
          pathLength={1}
          d={`M ${ROOT_X + 7} ${ROOT_Y} C ${ROOT_X + 40} ${ROOT_Y}, ${RING_X - RING_R - 40} ${RING_Y}, ${RING_X - RING_R - 4} ${RING_Y}`}
          fill="none"
          strokeWidth={1}
          className={cn("stroke-text", !scrub && "stage-lines")}
        />
        <text
          data-part="proof-label"
          x={ROOT_X - 4}
          y={ROOT_Y + 26}
          fontSize={10.5}
          className="fill-faint"
        >
          PROOF
        </text>
      </g>

      <g data-part="ring">
        {Array.from({ length: TICKS }, (_, i) => {
          const angle = (i / TICKS) * Math.PI * 2;
          const inner = i % 3 === 0 ? RING_R - 14 : RING_R - 9;
          const lit = at(3);
          const last = at(4) && i === TICKS - 1;
          return (
            <line
              key={i}
              x1={round(RING_X + Math.sin(angle) * inner)}
              y1={round(RING_Y - Math.cos(angle) * inner)}
              x2={round(RING_X + Math.sin(angle) * RING_R)}
              y2={round(RING_Y - Math.cos(angle) * RING_R)}
              strokeWidth={i % 3 === 0 ? 2.4 : 1.8}
              className={cn(
                "gauge-tick",
                last ? "stroke-signal" : lit ? "stroke-text" : "stroke-line-strong",
              )}
              style={scrub ? undefined : { transitionDelay: `${i * 18}ms`, opacity: lit ? 1 : 0.5 }}
            />
          );
        })}
        <text x={RING_X} y={RING_Y + 4} fontSize={11} textAnchor="middle" className="fill-text">
          {at(4) ? "VERIFIED" : at(3) ? "VERIFY" : "STELLAR"}
        </text>
        <text
          x={RING_X}
          y={RING_Y + RING_R + 18}
          fontSize={10.5}
          textAnchor="middle"
          className="fill-faint"
        >
          {at(4) ? "LEDGER 3,412,088 · 0.012 XLM" : "SOROBAN CONTRACT"}
        </text>
      </g>

      <g className={part(3)}>
        <text
          data-part="bar-label"
          x={RING_X + RING_R + 24}
          y={RING_Y - 26}
          fontSize={10.5}
          className="fill-faint"
        >
          OWED
        </text>
        <rect
          data-part="bar"
          x={RING_X + RING_R + 24}
          y={RING_Y - 20}
          width={78}
          height={8}
          className="fill-text"
        />
        <text
          data-part="bar-label"
          x={RING_X + RING_R + 24}
          y={RING_Y + 4}
          fontSize={10.5}
          className="fill-faint"
        >
          HELD
        </text>
        <rect
          data-part="bar"
          x={RING_X + RING_R + 24}
          y={RING_Y + 10}
          width={84}
          height={8}
          className="fill-text"
        />
        <rect
          data-part="bar-mark"
          x={RING_X + RING_R + 102}
          y={RING_Y + 10}
          width={2}
          height={8}
          className="fill-signal"
        />
        <line
          data-part="bar-mark"
          x1={RING_X + RING_R + 102}
          y1={RING_Y - 28}
          x2={RING_X + RING_R + 102}
          y2={RING_Y + 26}
          strokeWidth={1}
          strokeDasharray="2 2"
          className="stroke-text"
        />
      </g>

      <g className={part(5)} data-part="record">
        <rect
          x={RING_X - 90}
          y={RING_Y + 90}
          width={250}
          height={78}
          className="fill-bg stroke-text"
        />
        <text x={RING_X - 78} y={RING_Y + 110} fontSize={10.5} className="fill-faint">
          COVERAGE RECORD · 2026-11-02
        </text>
        <text x={RING_X - 78} y={RING_Y + 140} fontSize={26} className="fill-text">
          103.61%
        </text>
        <rect
          x={RING_X + 56}
          y={RING_Y + 120}
          width={78}
          height={20}
          className="fill-covered-tint stroke-covered"
        />
        <text
          x={RING_X + 95}
          y={RING_Y + 134}
          fontSize={10.5}
          textAnchor="middle"
          className="fill-covered"
        >
          COVERED
        </text>
        <text x={RING_X - 78} y={RING_Y + 158} fontSize={10.5} className="fill-faint">
          ARSK · LEDGER 3,412,088
        </text>
      </g>
    </svg>
  );
}
