import { StateStamp } from "@/components/ui/state-stamp";
import type { CoverageState } from "@/lib/coverage";

interface Meaning {
  state: CoverageState;
  statement: string;
  detail: string;
}

const MEANINGS: readonly Meaning[] = [
  {
    state: "covered",
    statement: "Reserves were at least what was owed at that ledger.",
    detail:
      "The record shows the percentage and the surplus. It describes that ledger only; the next day needs its own proof.",
  },
  {
    state: "short",
    statement: "Reserves were less than what was owed.",
    detail:
      "The record shows the gap in full. The percentage is cut off, never rounded up, so 98.999% reads as 98.99%.",
  },
  {
    state: "stale",
    statement: "No recent proof. Treat coverage as unknown.",
    detail: "Whatever the last result said no longer counts until a new proof is recorded.",
  },
];

export function ResultMeanings() {
  return (
    <ul className="border-t border-line">
      {MEANINGS.map((meaning) => (
        <li
          key={meaning.state}
          className="grid gap-2 border-b border-line py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-6"
        >
          <StateStamp state={meaning.state} className="self-start" />
          <div>
            <p className="text-body text-text">{meaning.statement}</p>
            <p className="mt-1 text-small text-sec">{meaning.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
