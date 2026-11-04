import { Chapter, ChapterHead } from "@/components/ui/ledger";

const PROMISES = [
  {
    title: "Solva never holds your funds",
    body: "Your reserves stay in your own reserve accounts, wherever you keep them. Solva works from the reserve balance, signed by your custodian or read from Stellar, and has no way to move money.",
  },
  {
    title: "Solva never publishes a customer's balance",
    body: "The record shows totals only. No customer is named and no list of balances is ever published. A customer's own check shows unnamed subtotals, including one neighbouring balance.",
  },
  {
    title: "Solva never rounds coverage up",
    body: "The percentage is cut off at two decimals. A reserve that is 99.999% of what is owed reads as 99.99%, and no proof of coverage can be made.",
  },
  {
    title: "Solva never edits a record",
    body: "Each result is written at a ledger and stays there. The next proof adds the next result. Showing a missed proof as stale is coming soon.",
  },
] as const;

export function NeverDoes() {
  return (
    <Chapter id="boundaries" index="02" labelledBy="never-title" tone="ink">
      <ChapterHead
        id="never-title"
        label="Boundaries"
        title="What Solva never does."
        lead="A record is precise about its own limits. These four rules hold on every check, for every asset."
      />
      <ul data-rows className="mt-14 border-t border-line">
        {PROMISES.map((promise) => (
          <li
            key={promise.title}
            className="grid gap-3 border-b border-line py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10"
          >
            <h3 className="font-display text-h3">{promise.title}</h3>
            <p className="max-w-[40rem] text-body text-sec">{promise.body}</p>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
