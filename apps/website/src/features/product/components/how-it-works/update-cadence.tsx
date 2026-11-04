import { Provenance, Ruled } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { coveragePercent } from "@/lib/amount";
import { kestrelHistory, kestrelRecord } from "@/lib/record-history";

export function UpdateCadence() {
  const recent = kestrelHistory.slice(-7).reverse();

  return (
    <Ruled className="bg-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <p className="text-small font-medium text-sec">Proof schedule for {kestrelRecord.asset}</p>
        <p className="text-small text-sec">Daily, 06:00 UTC</p>
      </div>
      <table className="w-full border-collapse font-mono text-small num">
        <caption className="sr-only">
          The last seven daily results for {kestrelRecord.asset}
        </caption>
        <thead>
          <tr className="border-b border-line font-sans text-sec">
            <th scope="col" className="px-5 py-2 text-left font-normal">
              Date
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal sm:table-cell">
              Ledger
            </th>
            <th scope="col" className="px-3 py-2 text-right font-normal">
              Coverage
            </th>
            <th scope="col" className="px-5 py-2 text-right font-normal">
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {recent.map((day) => (
            <tr key={day.date} className="border-b border-line last:border-b-0">
              <td className="px-5 py-2.5 text-text">{day.date}</td>
              <td className="hidden px-3 py-2.5 text-right text-sec sm:table-cell">
                {day.ledger ? day.ledger.toLocaleString("en-US") : "none"}
              </td>
              <td className="px-3 py-2.5 text-right text-text">
                {day.state === "stale" ? "unknown" : coveragePercent(day.owed, day.held)}
              </td>
              <td className="px-5 py-2.5 text-right">
                <StateStamp state={day.state} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line px-5 py-4">
        <p className="text-small text-sec">
          In this example the next proof is due at 06:00 UTC, and if it does not arrive the record
          turns stale. Scheduled publishing and freshness checks are coming soon.
        </p>
        <Provenance
          parts={[
            "Example",
            `${kestrelRecord.institution} · ${kestrelRecord.asset}`,
            "Last 7 days",
          ]}
          className="mt-3"
        />
      </div>
    </Ruled>
  );
}
