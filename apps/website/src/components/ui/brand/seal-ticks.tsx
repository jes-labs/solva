import { LONG_TICKS, MARK_PATH, MARK_TRANSFORM, SHORT_TICKS } from "./seal-geometry";

export function SealTicks() {
  return (
    <g className="stroke-ring" strokeLinecap="round">
      <g strokeWidth={2.6}>
        {SHORT_TICKS.map((tick) => (
          <line key={`s-${tick.x2}-${tick.y2}`} {...tick} />
        ))}
      </g>
      <g strokeWidth={3.2}>
        {LONG_TICKS.map((tick) => (
          <line key={`l-${tick.x2}-${tick.y2}`} {...tick} />
        ))}
      </g>
    </g>
  );
}

export function SealMarkPath() {
  return (
    <g transform={MARK_TRANSFORM}>
      <path
        d={MARK_PATH}
        fill="none"
        className="stroke-mark"
        strokeWidth={14}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}
