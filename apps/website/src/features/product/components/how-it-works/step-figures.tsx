import { verifierEvidence } from "@/config/evidence";
import { coveragePercent } from "@/lib/amount";
import { exampleRecords } from "@/lib/example-records";

const LEAVES = 8;
const ROW = 22;
const TOP = 24;

function leafY(index: number) {
  return TOP + index * ROW;
}

function pairY(a: number, b: number) {
  return (leafY(a) + leafY(b)) / 2;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

const figureClass = "h-auto w-full font-mono";

export function BalancesFigure() {
  return (
    <svg
      viewBox="0 0 320 224"
      role="img"
      aria-label="A list of balances entering the proof, each one kept private"
      className={figureClass}
    >
      {Array.from({ length: LEAVES }, (_, i) => (
        <g key={i} data-draw="row">
          <rect x={16} y={leafY(i) - 5} width={10} height={10} className="fill-bg stroke-text" />
          <text x={36} y={leafY(i) + 4} fontSize={10} className="fill-sec">
            {`row ${i + 1}`}
          </text>
          <rect
            data-draw="bar"
            x={100}
            y={leafY(i) - 4}
            width={60 + ((i * 29) % 110)}
            height={8}
            className="fill-text"
            opacity={0.3}
          />
          <rect
            x={100}
            y={leafY(i) - 5}
            width={180}
            height={10}
            fill="none"
            strokeDasharray="2 3"
            className="stroke-line-strong"
          />
        </g>
      ))}
      <line
        x1={16}
        y1={leafY(LEAVES - 1) + 18}
        x2={304}
        y2={leafY(LEAVES - 1) + 18}
        className="stroke-line"
      />
      <text x={16} y={leafY(LEAVES - 1) + 34} fontSize={10} className="fill-faint">
        every row private · 0 published
      </text>
    </svg>
  );
}

const L1_X = 150;
const L2_X = 210;
const ROOT_X = 270;
const L1 = [0, 2, 4, 6].map((i) => pairY(i, i + 1));
const L2 = [pairY(0, 3), pairY(4, 7)];
const ROOT_Y = pairY(0, 7);

export function CommitFigure() {
  return (
    <svg
      viewBox="0 0 320 224"
      role="img"
      aria-label="A list of balances folded into one commitment"
      className={figureClass}
    >
      <g fill="none" strokeWidth={1} className="stroke-line-strong">
        {Array.from({ length: LEAVES }, (_, i) => (
          <path
            data-draw="line"
            pathLength={1}
            key={i}
            d={`M 26 ${leafY(i)} C 70 ${leafY(i)}, ${L1_X - 40} ${L1[Math.floor(i / 2)]}, ${L1_X - 6} ${L1[Math.floor(i / 2)]}`}
          />
        ))}
        {L1.map((y, i) => (
          <path
            data-draw="line"
            pathLength={1}
            key={`l1-${i}`}
            d={`M ${L1_X + 6} ${y} C ${L1_X + 30} ${y}, ${L2_X - 30} ${L2[Math.floor(i / 2)]}, ${L2_X - 6} ${L2[Math.floor(i / 2)]}`}
          />
        ))}
        {L2.map((y, i) => (
          <path
            data-draw="line"
            pathLength={1}
            key={`l2-${i}`}
            d={`M ${L2_X + 6} ${y} C ${L2_X + 30} ${y}, ${ROOT_X - 30} ${ROOT_Y}, ${ROOT_X - 7} ${ROOT_Y}`}
          />
        ))}
      </g>
      {Array.from({ length: LEAVES }, (_, i) => (
        <rect
          key={i}
          x={16}
          y={leafY(i) - 5}
          width={10}
          height={10}
          className="fill-bg stroke-text"
        />
      ))}
      {L1.map((y, i) => (
        <rect
          key={`n1-${i}`}
          data-draw="pop"
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
          data-draw="pop"
          x={L2_X - 6}
          y={y - 6}
          width={12}
          height={12}
          className="fill-bg stroke-text"
        />
      ))}
      <rect
        data-draw="pop"
        x={ROOT_X - 7}
        y={ROOT_Y - 7}
        width={14}
        height={14}
        className="fill-text"
      />
      <text x={ROOT_X} y={ROOT_Y - 16} fontSize={10} textAnchor="middle" className="fill-text">
        commitment
      </text>
      <line
        x1={16}
        y1={leafY(LEAVES - 1) + 18}
        x2={304}
        y2={leafY(LEAVES - 1) + 18}
        className="stroke-line"
      />
      <text x={16} y={leafY(LEAVES - 1) + 34} fontSize={10} className="fill-faint">
        one commitment · total carried with it
      </text>
    </svg>
  );
}

const PROOF_W = 260;

export function ProofFigure() {
  return (
    <svg
      viewBox="0 0 320 208"
      role="img"
      aria-label="One proof, built from the commitment and the signed reserve balance, with no balance published"
      className={figureClass}
    >
      <rect x={16} y={24} width={14} height={14} className="fill-text" />
      <path d="M 30 31 L 58 31" fill="none" strokeDasharray="3 3" className="stroke-text" />
      <text x={64} y={35} fontSize={10} className="fill-sec">
        commitment + reserve balance → proof
      </text>

      <text x={16} y={76} fontSize={10} className="fill-faint">
        proof
      </text>
      <rect x={16} y={84} width={PROOF_W} height={18} className="fill-bg stroke-text" />
      <rect
        data-draw="bar"
        x={16}
        y={84}
        width={PROOF_W}
        height={18}
        className="fill-text"
        opacity={0.18}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1={16 + ((i + 1) * PROOF_W) / 13}
          y1={84}
          x2={16 + ((i + 1) * PROOF_W) / 13}
          y2={102}
          className="stroke-line"
        />
      ))}
      <text x={16 + PROOF_W + 8} y={97} fontSize={10} className="fill-text">
        one
      </text>

      <text x={16} y={132} fontSize={10} className="fill-faint">
        never published
      </text>
      <text x={16} y={150} fontSize={12} className="fill-text">
        every balance on the list
      </text>
      <text x={16} y={168} fontSize={10} className="fill-sec">
        public: the totals and the result
      </text>

      <line x1={16} y1={180} x2={304} y2={180} className="stroke-line" />
      <text x={16} y={196} fontSize={10} className="fill-faint">
        small enough for a contract to check
      </text>
    </svg>
  );
}

const RING_X = 96;
const RING_Y = 96;
const RING_R = 64;
const TICKS = 48;

export function VerifyFigure() {
  return (
    <svg
      viewBox="0 0 320 208"
      role="img"
      aria-label={`The verifier contract on Stellar Testnet checked the proof at ledger ${verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}`}
      className={figureClass}
      data-seal
    >
      {Array.from({ length: TICKS }, (_, i) => {
        const angle = (i / TICKS) * Math.PI * 2;
        const inner = i % 4 === 0 ? RING_R - 14 : RING_R - 8;
        return (
          <line
            key={i}
            x1={round(RING_X + Math.sin(angle) * inner)}
            y1={round(RING_Y - Math.cos(angle) * inner)}
            x2={round(RING_X + Math.sin(angle) * RING_R)}
            y2={round(RING_Y - Math.cos(angle) * RING_R)}
            strokeWidth={i % 4 === 0 ? 2.4 : 1.6}
            className={i === TICKS - 1 ? "gauge-tick stroke-signal" : "gauge-tick stroke-text"}
          />
        );
      })}
      <text x={RING_X} y={RING_Y + 4} fontSize={11} textAnchor="middle" className="fill-text">
        verified
      </text>

      <text x={190} y={54} fontSize={10} className="fill-faint">
        ledger
      </text>
      <text x={190} y={70} fontSize={12} className="fill-text">
        {verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}
      </text>
      <line x1={190} y1={82} x2={304} y2={82} className="stroke-line" />
      <text x={190} y={102} fontSize={10} className="fill-faint">
        fee
      </text>
      <text x={190} y={118} fontSize={12} className="fill-text">
        {`${verifierEvidence.feeXlm} XLM`}
      </text>
      <line x1={190} y1={130} x2={304} y2={130} className="stroke-line" />
      <text x={190} y={150} fontSize={10} className="fill-faint">
        checked by
      </text>
      <text x={190} y={166} fontSize={12} className="fill-text">
        the contract
      </text>

      <line x1={16} y1={180} x2={304} y2={180} className="stroke-line" />
      <text x={16} y={196} fontSize={10} className="fill-faint">
        {`stellar ${verifierEvidence.network.toLowerCase()} · checked on the network`}
      </text>
    </svg>
  );
}

const latest = exampleRecords[0];

export function RecordFigure() {
  const percent = coveragePercent(latest.owed, latest.held) ?? "";
  return (
    <svg
      viewBox="0 0 320 208"
      role="img"
      aria-label={`The written record: ${latest.institution} ${latest.asset}, ${percent}, covered, at ledger ${latest.ledger.toLocaleString("en-US")}`}
      className={figureClass}
    >
      <rect x={16} y={20} width={288} height={150} className="fill-bg stroke-text" />
      <line x1={16} y1={48} x2={304} y2={48} className="stroke-line" />
      <text x={28} y={38} fontSize={10} className="fill-faint">
        coverage record · 2026-11-02
      </text>
      <text x={28} y={98} fontSize={34} className="fill-text">
        {percent}
      </text>
      <g data-draw="pop">
        <rect x={214} y={66} width={78} height={20} className="fill-covered-tint stroke-covered" />
        <line x1={224} y1={71} x2={224} y2={81} strokeWidth={2} className="stroke-covered-fill" />
        <text x={258} y={80} fontSize={10} textAnchor="middle" className="fill-covered">
          COVERED
        </text>
      </g>
      <line x1={16} y1={118} x2={304} y2={118} className="stroke-line" />
      <text x={28} y={136} fontSize={10} className="fill-sec">
        {`${latest.institution.toLowerCase()} · ${latest.asset}`}
      </text>
      <text x={28} y={156} fontSize={10} className="fill-sec">
        {`ledger ${latest.ledger.toLocaleString("en-US")}`}
      </text>
      <line x1={16} y1={180} x2={304} y2={180} className="stroke-line" />
      <text x={16} y={196} fontSize={10} className="fill-faint">
        written once · read by anyone
      </text>
    </svg>
  );
}
