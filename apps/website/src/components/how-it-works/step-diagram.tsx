// Thin-line diagrams for the four pipeline steps. They are decorative, so they
// are aria-hidden. Structure lines use the muted color, the accent marks the
// meaningful part of each step.

const wrap = "h-auto w-full max-w-[200px]";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 110" className={wrap} fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

// Attest: read ledgers locally into the prover, inside your perimeter.
function Attest() {
  return (
    <Frame>
      <rect x="4" y="20" width="152" height="70" rx="12" stroke="var(--hair-strong)" strokeDasharray="3 6" />
      <rect x="12" y="40" width="44" height="30" rx="7" stroke="var(--sec)" strokeWidth="2" />
      <path d="M24 50h20M24 56h14M24 62h20" stroke="var(--sec)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M62 55h22m-7-5 7 5-7 5" stroke="var(--sec)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="98" y="38" width="48" height="34" rx="8" stroke="var(--acc-text)" strokeWidth="2" />
      <path d="M112 55l6 6 12-13" stroke="var(--acc-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// Commit: a Merkle tree with the root highlighted.
function Commit() {
  return (
    <Frame>
      <path
        d="M80 30 48 56M80 30 112 56M48 56 30 82M48 56 66 82M112 56 94 82M112 56 130 82"
        stroke="var(--sec)"
        strokeWidth="1.5"
      />
      <circle cx="80" cy="28" r="7" stroke="var(--acc-text)" strokeWidth="2" />
      <circle cx="48" cy="56" r="5" stroke="var(--sec)" strokeWidth="1.8" />
      <circle cx="112" cy="56" r="5" stroke="var(--sec)" strokeWidth="1.8" />
      {[30, 66, 94, 130].map((cx) => (
        <rect key={cx} x={cx - 5} y="80" width="10" height="10" rx="2" stroke="var(--sec)" strokeWidth="1.6" />
      ))}
    </Frame>
  );
}

// Prove: a zk circuit that outputs a single valid check.
function Prove() {
  return (
    <Frame>
      <rect x="50" y="33" width="60" height="44" rx="9" stroke="var(--sec)" strokeWidth="2" />
      <path
        d="M50 46h-8M50 56h-8M50 66h-8M110 46h8M110 56h8M110 66h8M66 33v-8M80 33v-8M94 33v-8M66 77v8M80 77v8M94 77v8"
        stroke="var(--sec)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M68 56l8 8 16-19" stroke="var(--acc-text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

// Verify: the proof checked by a contract on-chain.
function Verify() {
  return (
    <Frame>
      <rect x="40" y="26" width="42" height="58" rx="6" stroke="var(--sec)" strokeWidth="2" />
      <path d="M48 42h26M48 52h26M48 62h16" stroke="var(--sec)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M82 55h18" stroke="var(--sec)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="116" cy="55" r="12" stroke="var(--acc-text)" strokeWidth="2" />
      <path d="M110 55l4 4 8-9" stroke="var(--acc-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

const diagrams = [Attest, Commit, Prove, Verify];

export function StepDiagram({ index }: { index: number }) {
  const Diagram = diagrams[index] ?? Attest;
  return <Diagram />;
}
