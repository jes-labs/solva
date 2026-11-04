import { LeaderRow, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent, formatAmount } from "@/lib/amount";
import { heldShare } from "@/lib/coverage";
import { exampleRecords } from "@/lib/example-records";
import { dailyHistory, summarizeDays } from "../lib/history";
import { DayTicks } from "./day-ticks";

const record = exampleRecords[0];
const ADDRESS = "joinsolva.xyz/registry/kestrel-anchor/ARSK";
const DAYS = dailyHistory(28, { 9: "stale" });
const ANSWER = { covered: "Yes", short: "No", stale: "Unknown" } as const;

export function AnchorAssetPage() {
  const percent = coveragePercent(record.owed, record.held) ?? "Unknown";

  return (
    <article
      aria-label={`Public asset page for ${record.asset}, example`}
      className="ruled-marks relative border border-line bg-bg text-text"
    >
      <header className="border-b border-line px-5 py-3">
        <p className="truncate font-mono text-micro text-sec num">{ADDRESS}</p>
      </header>
      <div className="px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small text-sec">{record.institution}</p>
            <p className="font-display text-h2">{record.asset}</p>
          </div>
          <StateStamp state={record.state} />
        </div>
        <p className="mt-6 font-display text-h3">Is this token backed today?</p>
        <p className="mt-2 max-w-[44ch] text-body text-sec">
          {ANSWER[record.state]}. At ledger{" "}
          <span className="num">{record.ledger.toLocaleString("en-US")}</span>, reserves were{" "}
          <span className="num text-text">{percent}</span> of the tokens in circulation. Proven{" "}
          {record.provenAgo}.
        </p>
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-8">
          <SealInstrument
            mode="meter"
            share={heldShare(record)}
            state={record.state}
            className="mx-auto w-40 sm:w-full"
          >
            <span data-count className="seal-value font-display num">
              {percent}
            </span>
            <span className="mt-1 text-micro text-sec">Coverage</span>
          </SealInstrument>
          <div data-rows className="flex min-w-0 flex-col gap-3">
            <LeaderRow label="In circulation" value={formatAmount(record.owed, record.decimals)} />
            <LeaderRow label="Reserves" value={formatAmount(record.held, record.decimals)} />
            <LeaderRow label="Coverage" value={percent} tone="signal" />
          </div>
        </div>
        <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <p className="text-small text-sec">Last 28 days</p>
          <p className="font-mono text-micro text-sec num">{summarizeDays(DAYS)}</p>
        </div>
        <DayTicks className="mt-3" days={DAYS} label="Coverage over the last 28 days" />
      </div>
      <footer className="border-t border-line px-5 py-3">
        <Provenance parts={["Example", ledgerLabel(record.ledger), record.provenAgo]} />
      </footer>
    </article>
  );
}
