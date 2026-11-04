import { Provenance } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import type { CoverageState } from "@/lib/coverage";

interface EvidenceRow {
  date: string;
  state: CoverageState;
  proof?: { owed: string; held: string; ratio: string; ledger: string };
}

const ROWS: readonly EvidenceRow[] = [
  {
    date: "2026-11-02",
    state: "covered",
    proof: {
      owed: "243,118,400.00",
      held: "251,902,115.50",
      ratio: "103.61%",
      ledger: "3,412,088",
    },
  },
  {
    date: "2026-11-01",
    state: "covered",
    proof: {
      owed: "243,090,150.00",
      held: "251,644,020.00",
      ratio: "103.51%",
      ledger: "3,396,210",
    },
  },
  {
    date: "2026-10-31",
    state: "covered",
    proof: {
      owed: "242,870,500.00",
      held: "248,102,330.00",
      ratio: "102.15%",
      ledger: "3,380,447",
    },
  },
  {
    date: "2026-10-30",
    state: "covered",
    proof: {
      owed: "242,615,000.00",
      held: "252,310,900.00",
      ratio: "103.99%",
      ledger: "3,364,915",
    },
  },
  { date: "2026-10-29", state: "stale" },
  {
    date: "2026-10-28",
    state: "covered",
    proof: {
      owed: "242,402,800.00",
      held: "252,104,600.00",
      ratio: "104.00%",
      ledger: "3,333,876",
    },
  },
];

const HEAD = "px-3 py-3 text-small font-medium text-sec sm:px-4";
const CELL = "px-3 py-3 font-mono text-small num sm:px-4";

export function EvidenceExportFragment() {
  return (
    <div className="ruled-marks relative border border-line bg-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <p className="text-small text-sec">Daily evidence · example</p>
        <p className="font-display text-h3">
          Kestrel Anchor <span className="text-sec">· ARSK</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Daily coverage results for ARSK</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={HEAD}>
                Date
              </th>
              <th scope="col" className={`hidden text-right sm:table-cell ${HEAD}`}>
                Owed
              </th>
              <th scope="col" className={`hidden text-right sm:table-cell ${HEAD}`}>
                Held
              </th>
              <th scope="col" className={`text-right ${HEAD}`}>
                Coverage
              </th>
              <th scope="col" className={`text-right ${HEAD}`}>
                Ledger
              </th>
              <th scope="col" className={HEAD}>
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.date} className="border-b border-line last:border-b-0">
                <th scope="row" className={`font-normal text-text ${CELL}`}>
                  {row.date}
                </th>
                {row.proof ? (
                  <>
                    <td className={`hidden text-right text-sec sm:table-cell ${CELL}`}>
                      {row.proof.owed}
                    </td>
                    <td className={`hidden text-right text-sec sm:table-cell ${CELL}`}>
                      {row.proof.held}
                    </td>
                    <td className={`text-right text-text ${CELL}`}>{row.proof.ratio}</td>
                    <td className={`text-right text-sec ${CELL}`}>{row.proof.ledger}</td>
                  </>
                ) : (
                  <>
                    <td colSpan={2} className={`text-right text-sec sm:hidden ${CELL}`}>
                      No proof
                    </td>
                    <td colSpan={4} className={`hidden text-right text-sec sm:table-cell ${CELL}`}>
                      No proof arrived that day
                    </td>
                  </>
                )}
                <td className="px-3 py-3 sm:px-4">
                  <StateStamp state={row.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-4 py-3">
        <Provenance parts={["Example", "One row per day", "Exports as CSV"]} />
      </div>
    </div>
  );
}
