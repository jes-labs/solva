import { Chapter, ChapterHead, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { exampleRecords } from "@/lib/example-records";

const record = exampleRecords[1];

const GROUPS = [
  {
    title: "Stays with you",
    note: "Never published",
    rows: [
      { item: "Each customer's balance", who: "That customer, through their own check" },
      { item: "Customer names and account references", who: "Only your company" },
      { item: "The list of balances behind the commitment", who: "Only your company" },
    ],
  },
  {
    title: "Public on the record",
    note: "Free for anyone to read",
    rows: [
      { item: "The total you owe customers", who: "Everyone" },
      { item: "Reserves held for the asset", who: "Everyone" },
      { item: "Covered, short or stale, with the percentage (coming soon)", who: "Everyone" },
      { item: "The Stellar ledger each proof is tied to", who: "Everyone" },
    ],
  },
] as const;

export function CustodyPrivacy() {
  return (
    <Chapter id="privacy" index="01" labelledBy="privacy-title" tone="ink">
      <ChapterHead
        id="privacy-title"
        label="What leaves your systems"
        title="You publish one commitment, never a balance."
        lead="Each proof commits your customer balances as one value and shows that the total behind it is covered. The commitment, the totals and the result are public. The list itself never is. Today Solva holds the list and passes it to its prover over a private connection."
      />
      <div data-rows className="mt-14 grid border border-line lg:grid-cols-2">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="border-b border-line p-6 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <h3 className="font-display text-h2">{group.title}</h3>
            <p className="mt-2 text-small text-sec">{group.note}</p>
            <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
              {group.rows.map((row) => (
                <li key={row.item} className="py-3">
                  <p className="text-body text-text">{row.item}</p>
                  <p className="mt-0.5 text-small text-sec">Seen by: {row.who}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Provenance
        className="mt-6"
        parts={["Example", `${record.institution} · ${record.asset}`, ledgerLabel(record.ledger)]}
      />
    </Chapter>
  );
}
