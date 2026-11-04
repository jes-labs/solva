import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { LeaderRow, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { coveragePercent, formatAmount } from "@/lib/amount";
import { coverageShortfall, heldShare } from "@/lib/coverage";
import type { CoverageRecord } from "@/lib/coverage";
import { exampleRecords } from "@/lib/example-records";
import { cn } from "@/lib/utils";

interface RecordDocumentProps {
  record?: CoverageRecord;
  variant?: "full" | "compact";
  caption?: string;
  className?: string;
}

export function RecordDocument({
  record = exampleRecords[0],
  variant = "full",
  caption = "Example record",
  className,
}: RecordDocumentProps) {
  const percent = coveragePercent(record.owed, record.held) ?? "Unknown";
  const shortfall = coverageShortfall(record);
  const surplus = record.held > record.owed ? record.held - record.owed : 0n;
  const owedLabel = record.kind === "anchor" ? "Owed to holders" : "Owed to customers";
  const owedNote =
    record.kind === "anchor"
      ? "Token supply, read from Stellar"
      : "Customer balances, committed to the tree";

  return (
    <article
      aria-label={`Coverage record for ${record.institution}, ${record.asset}`}
      data-reveal
      className={cn("ruled-marks relative border border-line bg-bg text-text", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-small text-sec">Coverage record · {caption}</p>
          <p className="mt-1 truncate font-display text-h3">
            {record.institution} <span className="text-sec">· {record.asset}</span>
          </p>
        </div>
        <StateStamp state={record.state} />
      </header>

      <div
        className={cn(
          "grid gap-6 px-5 py-6",
          variant === "full"
            ? "sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-10"
            : "sm:grid-cols-[minmax(0,9rem)_1fr]",
        )}
      >
        <SealInstrument
          mode="meter"
          share={heldShare(record)}
          state={record.state}
          size={variant === "full" ? "default" : "compact"}
          className="mx-auto w-40 sm:w-full"
        >
          <span data-count className="seal-value font-display num">
            {percent}
          </span>
          <span className="mt-1.5 text-micro text-sec">Coverage</span>
        </SealInstrument>

        <div className="flex min-w-0 flex-col justify-center gap-3">
          <LeaderRow label={owedLabel} value={formatAmount(record.owed, record.decimals)} />
          <LeaderRow label="Held in reserve" value={formatAmount(record.held, record.decimals)} />
          {record.state === "short" ? (
            <LeaderRow
              label="Shortfall"
              value={formatAmount(shortfall, record.decimals)}
              tone="short"
            />
          ) : (
            <LeaderRow
              label="Surplus"
              value={formatAmount(surplus, record.decimals)}
              tone="signal"
            />
          )}
          {variant === "full" ? (
            <p className="mt-2 text-small text-sec">
              {owedNote}. Reserves are the signed balance of the reserve accounts.
            </p>
          ) : null}
        </div>
      </div>

      <footer className="border-t border-line px-5 py-3">
        <Provenance
          parts={[
            ledgerLabel(record.ledger),
            record.provenAgo,
            record.state === "stale" ? "No proof today" : "Proof checked on Stellar",
          ]}
        />
      </footer>
    </article>
  );
}
