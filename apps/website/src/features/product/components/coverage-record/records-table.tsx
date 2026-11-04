import { Provenance } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent, formatAmount } from "@/lib/amount";
import { kestrelHistory, kestrelRecord } from "@/lib/record-history";

const ROWS = 10;

export function RecordsTable() {
  const rows = kestrelHistory.slice(-ROWS).reverse();

  return (
    <div className="overflow-x-auto border border-line bg-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <p className="text-small font-medium text-sec">The last ten records</p>
        <p className="text-small text-sec">
          Every proven day is tied to a ledger that anyone can look up
        </p>
      </div>
      <table className="w-full min-w-[40rem] border-collapse font-mono text-small num">
        <caption className="sr-only">
          The ten most recent daily records for {kestrelRecord.institution} {kestrelRecord.asset}
        </caption>
        <thead>
          <tr className="border-b border-line font-sans text-sec">
            <th scope="col" className="px-5 py-2 text-left font-normal">
              Date
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal sm:table-cell">
              Ledger
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal md:table-cell">
              Owed
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal md:table-cell">
              Held
            </th>
            <th scope="col" className="px-3 py-2 text-right font-normal">
              Coverage
            </th>
            <th scope="col" className="hidden px-3 py-2 text-left font-normal sm:table-cell">
              State
            </th>
            <th scope="col" className="px-5 py-2 text-right font-normal">
              Check
            </th>
          </tr>
        </thead>
        <tbody data-rows>
          {rows.map((day) => (
            <tr key={day.date} className="border-b border-line last:border-b-0">
              <td className="px-5 py-2.5 whitespace-nowrap text-text">{day.date}</td>
              <td className="hidden px-3 py-2.5 text-right text-sec sm:table-cell">
                {day.ledger ? day.ledger.toLocaleString("en-US") : "none"}
              </td>
              <td className="hidden px-3 py-2.5 text-right text-sec md:table-cell">
                {formatAmount(day.owed, kestrelRecord.decimals)}
              </td>
              <td className="hidden px-3 py-2.5 text-right text-sec md:table-cell">
                {formatAmount(day.held, kestrelRecord.decimals)}
              </td>
              <td className="px-3 py-2.5 text-right text-text">
                {day.state === "stale" ? "unknown" : coveragePercent(day.owed, day.held)}
              </td>
              <td className="hidden px-3 py-2.5 sm:table-cell">
                <StateStamp state={day.state} />
              </td>
              <td className="px-5 py-2.5 text-right whitespace-nowrap">
                {day.ledger ? (
                  <span className="tick-lead text-micro font-medium tracking-[0.06em] text-text uppercase">
                    Verified
                  </span>
                ) : (
                  <span className="text-micro tracking-[0.06em] text-faint uppercase">
                    No proof
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line px-5 py-3">
        <Provenance
          parts={[
            "Example",
            `${kestrelRecord.institution} · ${kestrelRecord.asset}`,
            `Last ${ROWS} days`,
          ]}
        />
      </div>
    </div>
  );
}
