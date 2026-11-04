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
      "The record was written at the ledger it names.",
      "A holder's own balance is in the list, when they check.",
    ],
  },
  {
    label: "Attested",
    note: "Signed by the institution's reserve source",
    items: [
      "The reserve balance comes from a signed statement of the reserve accounts.",
      "For an anchor, what is owed is the token supply read from Stellar.",
      "For a custodial app, what is owed is the list it committed that day.",
    ],
  },
  {
    label: "Not proven",
    note: "What a record does not say",
    items: [
      "That cash in a reserve account exists beyond the signed statement.",
      "Anything about a day with no record. A missed day shows as stale.",
      "That an institution is sound in any other sense. A record shows coverage at one ledger; it is daily evidence for an auditor, never an audit.",
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
            A record is precise about its own limits. This is what the proof establishes, what rests
            on a signature, and what no record claims. The full version is on the{" "}
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
