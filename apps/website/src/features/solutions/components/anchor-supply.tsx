import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { RecordDocument } from "@/components/ui/record-document";
import { SupplyFigure } from "@/components/ui/supply-figure";
import { exampleRecords } from "@/lib/example-records";
import type { SupplySnapshot } from "@/lib/stellar-supply";

const FIELDS = [
  {
    label: "Owed",
    value:
      "The token supply at the proof's ledger, read from Stellar. You never have to report it.",
  },
  {
    label: "Held",
    value:
      "The balance of your reserve accounts, signed by the account that holds them. This is the one figure you report.",
  },
  { label: "Coverage", value: "Held divided by owed, never rounded up." },
  {
    label: "State",
    value: "Covered at or above 100%, short below it, and stale when no proof arrived in time.",
  },
] as const;

const YOUR_PART = [
  "Tell Solva where the reserves for each asset are held.",
  "Report the signed reserve balance on the schedule you agree with us.",
  "Approve any change to your entry with your team's passkey.",
] as const;

interface AnchorSupplyProps {
  snapshot: SupplySnapshot | null;
}

export function AnchorSupply({ snapshot }: AnchorSupplyProps) {
  return (
    <Chapter id="supply-and-reserves" index="01" labelledBy="supply-title">
      <ChapterHead
        id="supply-title"
        label="Supply and reserves"
        title="Supply is read from the ledger. Reserves are attested."
        lead="What you owe is the token supply, which is already public on Stellar. What you hold is the signed balance of your reserve accounts. Every day, Solva proves that the second covers the first and writes the result where anyone can read it."
      />
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-14">
        <div className="flex min-w-0 flex-col gap-6">
          <SupplyFigure snapshot={snapshot} />
          <p className="max-w-[44rem] text-body text-sec">
            Four fiat tokens issued on Stellar today, with the supply the ledger reports for each.
            That is the half of the question anyone can already answer. The record adds the other
            half: whether signed reserves cover that supply, proven every day. The record below is
            an example of what that looks like.
          </p>
          <RecordDocument record={exampleRecords[0]} className="bg-bg" />
        </div>
        <div className="flex flex-col lg:pt-4">
          <p className="text-small font-medium text-sec">Where each number comes from</p>
          <dl className="mt-3 border-t border-line">
            {FIELDS.map((field) => (
              <div
                key={field.label}
                className="grid grid-cols-[6rem_1fr] gap-4 border-b border-line py-3"
              >
                <dt className="text-small text-sec">{field.label}</dt>
                <dd className="text-small text-text">{field.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-small font-medium text-sec">Your part</p>
          <ul className="mt-3 border-t border-line">
            {YOUR_PART.map((item) => (
              <li key={item} className="border-b border-line py-3 text-small text-text">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Chapter>
  );
}
