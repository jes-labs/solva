import Link from "next/link";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";

const COLUMNS = [
  {
    label: "Proven",
    note: "By the proof, checked on Stellar",
    items: [
      "Every balance in the list was counted, and none was negative.",
      "The total of the list is at most the reserve balance in the proof.",
      "The record was written by the contract, stamped with the time of the ledger that accepted it.",
      "A holder's own balance is in the list, when they check.",
    ],
  },
  {
    label: "Attested",
    note: "Supplied from outside the proof",
    items: [
      "The reserve balance comes from the reserve source: a statement signed by the custodian, or the balance of Stellar accounts read from the ledger.",
      "For an anchor, what is owed is a stored list of holder balances. Reading the supply from Stellar is coming soon.",
      "For a custodial app, what is owed is the list it committed for that proof.",
    ],
  },
  {
    label: "Not proven",
    note: "What a record does not say",
    items: [
      "That reserves held with a custodian exist beyond its signed statement.",
      "Anything about a day with no record. Showing a missed day as stale is coming soon.",
      "That an institution is sound in any other sense. A record shows coverage at one ledger; it is evidence for an auditor, never an audit.",
    ],
  },
] as const;

export function Proves() {
  return (
    <Chapter id="what-it-proves" index="03" labelledBy="proves-title" tone="ink">
      <ChapterHead
        id="proves-title"
        label="What it proves"
        title="Every issuer says it is backed. Here is what you can check."
        lead={
          <>
            A record is precise about its own limits. This is what the proof establishes, what comes
            from outside it, and what no record claims. The full version is on the{" "}
            <Link
              href={routes.trust}
              className="text-text underline decoration-link-line underline-offset-4"
            >
              trust page
            </Link>
            .
          </>
        }
      />
      <div data-rows className="mt-14 grid border border-line lg:grid-cols-3">
        {COLUMNS.map((column) => (
          <div
            key={column.label}
            className="border-b border-line p-6 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <h3 className="font-display text-h2">{column.label}</h3>
            <p className="mt-2 text-small text-sec">{column.note}</p>
            <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
              {column.items.map((item) => (
                <li key={item} className="py-3 text-body text-sec">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Chapter>
  );
}
