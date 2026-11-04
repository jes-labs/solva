import { Chapter, ChapterHead } from "@/components/ui/ledger";

const NOTES = [
  {
    title: "Your registry entry",
    body: "Each institution publishes to its own contract on Stellar. A proof for one never touches another, and the entry is controlled by the institution's own passkey.",
  },
  {
    title: "Connect the reserve source",
    body: "Solva holds no credentials for your reserve source. For a custodian, it runs a standard authorisation handshake, then reads balances with a short-lived token; on this page the custodian is Solva's sandbox. For reserves held on Stellar, nothing needs authorising: account balances are public.",
  },
  {
    title: "Read the reserve balance",
    body: "A custodian returns each balance with its signature, and the signature is checked before the balance goes anywhere near the proof. Reserves held on Stellar are read straight from the account on the ledger, which anyone can check on an explorer.",
  },
  {
    title: "Prove coverage and publish",
    body: "What is owed is committed as one value. The proof shows that the total behind it is at most the reserve balance, and the contract on Stellar checks the proof before it stores the result.",
  },
  {
    title: "Check the published record",
    body: "This page reads the latest proof straight from the institution's contract with get_latest_proof, as anyone can. The record carries the reserve total, the committed total and the time, and nothing about any single balance.",
  },
  {
    title: "A holder checks they were counted",
    body: "A holder presents their account reference, this page looks up their inclusion path for the published proof, and the contract checks that path with verify_inclusion. No other customer is named; the path shows unnamed subtotals, including one neighbouring balance.",
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
