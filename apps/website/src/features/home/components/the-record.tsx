import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { RecordDocument } from "@/components/ui/record-document";
import { exampleRecords } from "@/lib/example-records";
import { CalendarField, calendarTotals } from "./calendar-field";

const FIELDS = [
  { label: "Institution and asset", value: "Who owes, and in what" },
  { label: "Owed", value: "Holder or customer balances, committed" },
  { label: "Held", value: "The signed balance of the reserve accounts" },
  { label: "Coverage", value: "Held divided by owed, never rounded up" },
  { label: "State", value: "Covered, short or stale (coming soon)" },
  { label: "Ledger", value: "Where and when the proof was checked" },
] as const;

export function TheRecord() {
  return (
    <Chapter id="the-record" index="01" labelledBy="record-title">
      <ChapterHead
        id="record-title"
        label="The record"
        title="One record, every day."
        lead="Everything Solva does ends in this document. It is small on purpose: six fields that a holder, a partner or an auditor can read in a minute, and that a contract on Stellar can read in one call."
        align="end"
      />
      <figure className="mt-12 hidden lg:block" data-reveal>
        <div className="opacity-60">
          <CalendarField />
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between gap-4 font-mono text-micro tracking-[0.06em] text-faint uppercase num">
          <span>
            Last {calendarTotals.days / 7} weeks · day{" "}
            <span data-cal-day={calendarTotals.days}>{calendarTotals.days}</span>
          </span>
          <span>
            <span data-cal-proofs={calendarTotals.proofs}>{calendarTotals.proofs}</span> proofs
            landed · <span data-cal-missed={calendarTotals.missed}>{calendarTotals.missed}</span>{" "}
            days missed, left hollow
          </span>
        </figcaption>
      </figure>
      <div className="relative mt-8 lg:mt-10">
        <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-14">
          <RecordDocument record={exampleRecords[0]} className="bg-bg" />
          <div className="flex flex-col lg:pt-4">
            <p className="text-small font-medium text-sec">What each field means</p>
            <dl data-rows className="mt-3 border-t border-line">
              {FIELDS.map((field) => (
                <div
                  key={field.label}
                  className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-line py-3"
                >
                  <dt className="text-small text-sec">{field.label}</dt>
                  <dd className="text-small text-text">{field.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-small text-sec">
              A year of records reads like a calendar: a solid tick for each day a proof landed, a
              hollow tick for each day it did not. Nothing is edited after the fact.
            </p>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
