import { Chapter, ChapterHead, LeaderRow, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { coveragePercent } from "@/lib/amount";
import { exampleRecords } from "@/lib/example-records";

const record = exampleRecords[1];
const percent = coveragePercent(record.owed, record.held) ?? "Unknown";

const READERS = [
  {
    name: "Your customers",
    body: "A page in your app, or a link from it, where each customer can see that their balance was counted and that the total was covered. A ready-made customer page is coming soon.",
    rows: [
      { label: "Account", value: "NWC-0418" },
      { label: "Result", value: "Counted", tone: "signal" as const },
    ],
  },
  {
    name: "Wallets and lending pools",
    body: "Partners read your verified totals from Stellar for free, without asking you for a report. Covered, short and stale verdicts for them to act on are coming soon.",
    rows: [
      { label: record.asset, value: percent },
      { label: "Checked at", value: ledgerLabel(record.ledger) },
    ],
  },
  {
    name: "Auditors",
    body: "A dated result for every proof, each tied to a ledger, including the totals your customers check against: evidence to check between audits. A daily CSV export is coming soon.",
    rows: [
      { label: "Export", value: "daily-evidence-usdc.csv" },
      { label: "Rows per year", value: "365" },
    ],
  },
] as const;

export function CustodyReaders() {
  return (
    <Chapter id="who-reads-it" index="03" labelledBy="custody-readers-title">
      <ChapterHead
        id="custody-readers-title"
        label="Readers"
        title="Who reads it, and what they see."
      />
      <div data-rows className="mt-14 grid border border-line lg:grid-cols-3">
        {READERS.map((reader) => (
          <div
            key={reader.name}
            className="min-w-0 border-b border-line p-6 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <h3 className="font-display text-h3">{reader.name}</h3>
            <p className="mt-3 text-body text-sec">{reader.body}</p>
            <div className="mt-6 flex flex-col gap-2.5 border-t border-line pt-4">
              {reader.rows.map((row) => (
                <LeaderRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  tone={"tone" in row ? row.tone : "default"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Provenance
        className="mt-6"
        parts={["Example", `${record.institution} · ${record.asset}`, record.provenAgo]}
      />
    </Chapter>
  );
}
