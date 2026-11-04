"use client";

import { Chapter, ChapterHead, LeaderRow, Provenance, Ruled } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent, formatAmount } from "@/lib/amount";
import type { CoverageState } from "@/lib/coverage";
import { stateLabel } from "@/lib/coverage";
import { cn } from "@/lib/utils";
import { useDayPicker } from "../../hooks/use-day-picker";
import {
  countStates,
  formatDay,
  kestrelHistory,
  kestrelRecord,
  kestrelYear,
  proofDays,
} from "@/lib/record-history";
import { RecordsTable } from "./records-table";

const tickTone: Record<CoverageState, string> = {
  covered: "bg-text",
  short: "bg-short-fill",
  stale: "border-l border-dashed border-stale-fill bg-transparent",
};

const yearDays = proofDays(kestrelYear);
const yearCount = countStates(kestrelYear);

export function RecordHistory() {
  const days = kestrelHistory;
  const { selected, select, register, handleKeyDown } = useDayPicker(days.length);
  const day = days[selected];
  const count = countStates(days);
  const first = days[0];
  const last = days.at(-1);

  return (
    <Chapter id="history" index="02" labelledBy="history-title" tone="tint">
      <ChapterHead
        id="history-title"
        label="The history"
        title="A year of days, one tick each."
        lead="Every day a proof lands, the Seal gains a solid tick. A missed day shows as a hollow one. Nothing is edited after the fact, so the history itself is the evidence."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
        <figure className="min-w-0">
          <SealInstrument
            mode="calendar"
            days={yearDays}
            today={yearDays.length - 1}
            title={`${yearDays.length} days of ${kestrelRecord.asset} records, ${yearCount.stale} without a proof`}
            className="mx-auto w-56 sm:w-64 lg:w-full"
          >
            <span data-count className="seal-value font-display num">
              {yearDays.length - yearCount.stale}
            </span>
            <span className="mt-1.5 text-micro text-sec">proofs in {yearDays.length} days</span>
          </SealInstrument>
          <figcaption data-rows className="mt-6 flex flex-col gap-2.5">
            <LeaderRow label="Covered days" value={String(yearCount.covered)} />
            <LeaderRow
              label="Short days"
              value={String(yearCount.short)}
              tone={yearCount.short > 0 ? "short" : "default"}
            />
            <LeaderRow label="Missed days" value={String(yearCount.stale)} />
            <Provenance
              parts={[
                "Example",
                `${kestrelRecord.institution} · ${kestrelRecord.asset}`,
                "Last 365 days",
              ]}
              className="mt-2"
            />
          </figcaption>
        </figure>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-small font-medium text-sec">Last 90 days</p>
            <p className="font-mono text-small text-sec num">
              {count.covered} covered · {count.short} short · {count.stale} stale
            </p>
          </div>
          <div
            role="group"
            data-ticks
            aria-label="Daily results. Use the arrow keys to move between days."
            className="mt-4 grid grid-cols-15 gap-x-1 gap-y-3 border-y border-line py-3 md:grid-cols-30 xl:grid-cols-45"
          >
            {days.map((entry, index) => (
              <button
                key={entry.date}
                ref={register(index)}
                type="button"
                tabIndex={index === selected ? 0 : -1}
                aria-pressed={index === selected}
                aria-label={`${formatDay(entry.date)}, ${stateLabel[entry.state]}`}
                onClick={() => select(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "relative h-7 min-w-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus",
                  index === selected && "outline-2 outline-text",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2",
                    tickTone[entry.state],
                  )}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-micro text-faint num">
            <span>{first?.date}</span>
            <span>{last?.date}</span>
          </div>

          {day ? (
            <Ruled className="mt-6 bg-bg">
              <div
                aria-live="polite"
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3"
              >
                <p key={day.date} className="swap-in text-small font-medium text-text">
                  {formatDay(day.date)}
                </p>
                <span key={`${day.date}-stamp`} className="swap-in inline-flex">
                  <StateStamp state={day.state} />
                </span>
              </div>
              <div
                key={`${day.date}-body`}
                className="swap-in grid gap-5 px-5 py-4 sm:grid-cols-[1fr_minmax(0,14rem)]"
              >
                <p className="text-small text-sec">
                  {day.state === "stale"
                    ? "No proof was recorded that day. Treat coverage as unknown until the next proof lands."
                    : day.state === "short"
                      ? `Reserves were short by ${formatAmount(day.owed - day.held, kestrelRecord.decimals)} ${kestrelRecord.asset} at this ledger.`
                      : "Reserves were at least what was owed at this ledger."}
                </p>
                <div className="flex flex-col gap-2.5">
                  <LeaderRow
                    label={day.state === "stale" ? "Last known" : "Coverage"}
                    value={coveragePercent(day.owed, day.held)}
                    tone={day.state === "short" ? "short" : "default"}
                  />
                  <LeaderRow
                    label="Ledger"
                    value={day.ledger ? day.ledger.toLocaleString("en-US") : "None"}
                  />
                </div>
              </div>
            </Ruled>
          ) : null}

          <div data-reveal className="mt-10">
            <RecordsTable />
          </div>
        </div>
      </div>
    </Chapter>
  );
}
