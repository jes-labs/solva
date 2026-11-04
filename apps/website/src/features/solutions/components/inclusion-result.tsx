import { LeaderRow } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { formatAmount } from "@/lib/amount";
import type { InclusionResult, InclusionSnapshot } from "../lib/inclusion";

interface InclusionResultPanelProps {
  result: InclusionResult;
  snapshot: InclusionSnapshot;
}

export function InclusionResultPanel({ result, snapshot }: InclusionResultPanelProps) {
  const ledger = snapshot.ledger.toLocaleString("en-US");

  return (
    <div aria-live="polite" className="border-t border-line pt-5">
      {result.status === "counted" ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-display text-h3">Your balance was counted</p>
            <StateStamp state="covered" label="Counted" />
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <LeaderRow label="Account" value={result.reference} />
            <LeaderRow
              label="Your balance"
              value={`${formatAmount(result.balance, snapshot.decimals)} ${snapshot.asset}`}
            />
            <LeaderRow
              label="Part of the total owed"
              value={`${formatAmount(result.total, snapshot.decimals)} ${snapshot.asset}`}
            />
            <LeaderRow label="Proof at ledger" value={ledger} tone="signal" />
          </div>
          <p className="mt-4 text-small text-sec">
            The reserves behind this total covered it at the same ledger. No other customer is
            named; the path shows unnamed subtotals, including one neighbouring balance.
          </p>
        </>
      ) : null}
      {result.status === "not-found" ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-display text-h3">No balance found</p>
            <StateStamp state="short" label="Not found" />
          </div>
          <p className="mt-4 text-small text-sec">
            <span className="font-mono text-text num">{result.reference}</span> is not in the proof
            at ledger <span className="num">{ledger}</span>. If you hold a balance with{" "}
            {snapshot.institution}, raise it with them. Catching this is what the check is for.
          </p>
        </>
      ) : null}
      {result.status === "invalid" ? (
        <>
          <p className="font-display text-h3">Check the reference</p>
          <p className="mt-4 text-small text-sec">
            An account reference has three letters and four digits, for example{" "}
            <span className="font-mono text-text num">NWC-0418</span>.
          </p>
        </>
      ) : null}
      {result.status === "idle" ? (
        <>
          <p className="font-display text-h3">Ready to check</p>
          <p className="mt-4 text-small text-sec">
            Pick an example customer or enter a reference, then run the check.
          </p>
        </>
      ) : null}
    </div>
  );
}
