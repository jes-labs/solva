import { LONG_TICKS, MARK_PATH, MARK_TRANSFORM, SHORT_TICKS } from "./seal-geometry";
import { WORDMARK_PATH } from "./wordmark-path";

function SealParts() {
  return (
    <>
      <g className="seal-ring" strokeLinecap="round">
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
      <g transform={MARK_TRANSFORM}>
        <path
          d={MARK_PATH}
          fill="none"
          className="seal-mark"
          strokeWidth={14}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

export function SealGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <SealParts />
    </svg>
  );
}

export function DocsLockup() {
  return (
    <span className="docs-lockup">
      <svg viewBox="0 0 366.5 120" className="docs-lockup-mark" role="img">
        <title>Solva</title>
        <SealParts />
        <g transform="translate(132,92)">
          <path d={WORDMARK_PATH} className="wordmark" />
        </g>
      </svg>
      <span className="docs-lockup-tag">Docs</span>
    </span>
  );
}
