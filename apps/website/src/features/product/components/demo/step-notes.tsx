import { Chapter, ChapterHead } from "@/components/ui/ledger";

const NOTES = [
  {
    title: "Your registry entry",
    body: "Each institution publishes to its own contract on Stellar. A proof for one never touches another, and the entry is controlled by the institution's own passkey.",
  },
  {
    title: "Connect the reserve source",
    body: "Solva holds no credentials for your reserve source. It runs a standard authorisation handshake against the source, then reads balances on the institution's behalf with a short-lived token.",
  },
  {
    title: "Read the signed balance",
    body: "Each reserve account returns its balance with a signature from the source that holds it. The signature is checked before the balance goes anywhere near the proof.",
  },
  {
    title: "Prove coverage and publish",
    body: "What is owed is committed as one value. The proof shows that the total behind it is at most the signed reserve balance, and the contract on Stellar checks the proof before it stores the result.",
  },
  {
    title: "Check it on Stellar",
    body: "Anyone can read the latest proof from the contract with get_latest_proof. This page reads the same published totals from Solva's index of the registry. The record carries the reserve total, the committed total and the proof number, and nothing about any single balance.",
  },
  {
    title: "A holder checks they were counted",
    body: "A holder presents their account reference, and this page looks up their inclusion path for the published proof. Checking that path against the contract with verify_inclusion from this page is coming soon. No other customer is named; the path shows unnamed subtotals, including one neighbouring balance.",
  },
] as const;

export function StepNotes() {
  return (
    <Chapter index="02" labelledBy="notes-title" tone="tint">
      <ChapterHead id="notes-title" label="Step by step" title="What each step does." align="end" />
      <ol data-rows className="mt-14 border-t border-line">
        {NOTES.map((note) => (
          <li
            key={note.title}
            className="grid gap-3 border-b border-line py-6 lg:grid-cols-[18rem_1fr] lg:gap-12"
          >
            <h3 className="font-display text-h3">{note.title}</h3>
            <p className="max-w-[44rem] text-body text-sec">{note.body}</p>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
