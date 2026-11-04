import { Chapter, ChapterHead, Provenance } from "@/components/ui/ledger";
import { cn } from "@/lib/utils";

interface CompareRow {
  fact: string;
  attestation: string;
  record: string;
  counted: boolean;
}

const ROWS: readonly CompareRow[] = [
  { fact: "Documents per year", attestation: "12", record: "365", counted: true },
  { fact: "Days stale at worst", attestation: "30 to 90", record: "1", counted: true },
  { fact: "Who can check", attestation: "Those it is sent to", record: "Anyone", counted: false },
  { fact: "Cost to read", attestation: "A request and a wait", record: "Free", counted: false },
  { fact: "Tied to a Stellar ledger", attestation: "No", record: "Every result", counted: false },
];

export function CustodyCompare() {
  return (
    <Chapter id="the-record-compare" index="02" labelledBy="compare-title">
      <ChapterHead
        id="compare-title"
        label="Alongside your auditor"
        title="A monthly attestation, and a record every day."
        lead="Most custodial apps publish an attestation a few times a year. Keep it. This is what changes, counted for one asset over one year, once a record also lands every day. Daily publishing is coming soon."
        align="end"
      />
      <table className="mt-14 w-full border border-line text-left">
        <caption className="sr-only">
          A monthly PDF attestation compared with a daily coverage record
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-3 text-small font-medium text-sec sm:px-6">
              <span className="sr-only">Fact</span>
            </th>
            <th
              scope="col"
              className="border-l border-line px-4 py-3 text-small font-medium text-sec sm:px-6"
            >
              Monthly PDF attestation
            </th>
            <th
              scope="col"
              className="border-l border-line px-4 py-3 text-small font-medium text-sec sm:px-6"
            >
              Daily coverage record
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.fact} className="border-b border-line last:border-b-0">
              <th
                scope="row"
                className="px-4 py-4 align-top text-small font-normal text-sec sm:px-6"
              >
                {row.fact}
              </th>
              <td
                className={cn(
                  "border-l border-line px-4 py-4 align-top text-body text-text sm:px-6",
                  row.counted && "font-mono text-small num",
                )}
              >
                {row.attestation}
              </td>
              <td
                className={cn(
                  "border-l border-line px-4 py-4 align-top text-body text-text sm:px-6",
                  row.counted && "font-mono text-small num",
                )}
              >
                {row.record}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Provenance className="mt-6" parts={["Counted for one asset over one year", "Example"]} />
    </Chapter>
  );
}
