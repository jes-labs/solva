import { LeaderRow, Provenance, Ruled, ledgerLabel } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent, formatAmount } from "@/lib/amount";
import { cn } from "@/lib/utils";
import {
  countStates,
  daysInMonth,
  formatDay,
  kestrelHistory,
  kestrelRecord,
} from "@/lib/record-history";

const ledger = kestrelRecord.ledger.toLocaleString("en-US");

export function WalletFigure() {
  return (
    <Ruled marks className="bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-small font-medium text-sec">Send {kestrelRecord.asset}</p>
        <p className="text-small text-sec">{kestrelRecord.institution}</p>
      </div>
      <div className="px-5 py-5">
        <p data-count className="font-display text-figure num">
          12,400.00
        </p>
        <div data-rows className="mt-5 flex flex-col gap-2.5">
          <LeaderRow label="To" value="GBX7…K4QE" />
          <LeaderRow label="Network fee" value="0.00001 XLM" />
          <div className="flex items-baseline gap-3 font-mono text-small num">
            <span className="text-sec">Coverage</span>
            <span
              aria-hidden="true"
              className="min-w-4 flex-1 border-b border-dotted border-line-strong"
            />
            <span className="flex items-center gap-2">
              <StateStamp state={kestrelRecord.state} />
              <span className="text-text">{kestrelRecord.provenAgo}</span>
            </span>
          </div>
        </div>
        <p className="mt-5 text-small text-sec">
          A stale asset shows here as unknown. It is never shown as covered.
        </p>
      </div>
      <div className="border-t border-line px-5 py-3">
        <Provenance parts={["Example", "Wallet send screen", ledgerLabel(kestrelRecord.ledger)]} />
      </div>
    </Ruled>
  );
}

const RULES = [
  { label: "Accept new deposits", when: "while covered", state: "covered" as const },
  { label: "Pause new deposits", when: "while short", state: "short" as const },
  { label: "Pause new deposits", when: "while stale", state: "stale" as const },
];

export function LendingFigure() {
  return (
    <Ruled marks className="bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-small font-medium text-sec">{kestrelRecord.asset} collateral rule</p>
        <p className="text-small text-sec">Example rule, checked before every deposit</p>
      </div>
      <ul data-rows>
        {RULES.map((rule) => {
          const active = rule.state === kestrelRecord.state;
          return (
            <li
              key={rule.state}
              className={cn(
                "relative flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 pr-5 pl-6",
                active ? "text-text" : "text-sec",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-3 bottom-3 left-0 w-0.5",
                  active ? "rule-live bg-signal" : "bg-transparent",
                )}
              />
              <span className="text-small">
                {rule.label} <span className="text-sec">{rule.when}</span>
              </span>
              <StateStamp state={rule.state} />
            </li>
          );
        })}
      </ul>
      <div data-rows className="flex flex-col gap-2.5 px-5 py-4">
        <LeaderRow label="Call (planned)" value="is_covered(issuer, asset)" />
        <LeaderRow label="Today" value="deposits open" tone="signal" />
        <LeaderRow label="Checked at" value={<span data-count>{ledger}</span>} />
      </div>
      <div className="border-t border-line px-5 py-3">
        <Provenance parts={["Example", "Lending pool policy", "Reading a record is free"]} />
      </div>
    </Ruled>
  );
}

export function AuditorFigure() {
  const october = daysInMonth(kestrelHistory, "2026-10");
  const count = countStates(october);
  const staleDays = october.filter((day) => day.state === "stale");
  const lowest = october
    .filter((day) => day.state !== "stale")
    .reduce<
      (typeof october)[number] | null
    >((low, day) => (!low || day.held * low.owed < low.held * day.owed ? day : low), null);

  return (
    <Ruled marks className="bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-small font-medium text-sec">
          Evidence for {kestrelRecord.asset}, October 2026
        </p>
        <p className="text-small text-sec">One row per day, with its ledger</p>
      </div>
      <div data-rows className="flex flex-col gap-2.5 px-5 py-5">
        <LeaderRow label="Daily results" value={<span data-count>{october.length}</span>} />
        <LeaderRow label="Covered" value={<span data-count>{count.covered}</span>} />
        <LeaderRow label="Short" value={String(count.short)} />
        <LeaderRow
          label="Stale"
          value={`${count.stale} · ${staleDays.map((day) => formatDay(day.date)).join(", ")}`}
        />
        {lowest ? (
          <LeaderRow
            label="Lowest coverage"
            value={`${coveragePercent(lowest.owed, lowest.held)} · ${formatDay(lowest.date)}`}
          />
        ) : null}
        <LeaderRow
          label="Supply at month end"
          value={<span data-count>{formatAmount(kestrelRecord.owed, kestrelRecord.decimals)}</span>}
        />
      </div>
      <div className="border-t border-line px-5 py-3">
        <Provenance parts={["Example", "Auditor export", "31 rows, each with a ledger"]} />
      </div>
    </Ruled>
  );
}
