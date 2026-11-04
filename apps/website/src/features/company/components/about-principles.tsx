import { Chapter, ChapterHead, LeaderRow } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";

const PRINCIPLES = [
  {
    title: "Never round up",
    body: "Coverage is held divided by owed, cut off at two decimals. 99.996 percent is shown as 99.99 percent, and a short record shows the size of the gap.",
    figure: (
      <div className="flex flex-col gap-2.5">
        <LeaderRow label="Held" value="99,996.00" />
        <LeaderRow label="Owed" value="100,000.00" />
        <LeaderRow label="Coverage" value="99.99%" tone="short" />
      </div>
    ),
  },
  {
    title: "Never publish a balance",
    body: "A custodial app commits its customer balances as one value, and the proof shows that the total is covered. Each customer can check that their own balance was counted. Nobody can check anyone else's.",
    figure: (
      <div className="flex flex-col gap-2.5">
        <LeaderRow label="Balances committed" value="41,206" />
        <LeaderRow label="Balances published" value="0" tone="signal" />
        <LeaderRow label="Commitment" value="0x0c5c…922e" />
      </div>
    ),
  },
  {
    title: "Never edit a record",
    body: "Every day's result stays. A missed day is written as stale and never filled in later. A correction is published as a new record with a note, and the old record stays as it was.",
    figure: (
      <div className="flex flex-wrap items-center gap-2">
        <StateStamp state="covered" />
        <StateStamp state="covered" />
        <StateStamp state="stale" />
        <StateStamp state="covered" />
        <StateStamp state="short" />
      </div>
    ),
  },
  {
    title: "Never ask for trust",
    body: "A contract on Stellar checks the proof. Solva never checks its own work. The verifier, its code and a verified transaction are linked at the bottom of every page, so anyone can repeat the check.",
    figure: (
      <div className="flex flex-col gap-2.5">
        <LeaderRow label="Checked by" value="Soroban contract" />
        <LeaderRow label="Fee" value="0.0122514 XLM" />
        <LeaderRow label="Source" value="Apache 2.0" tone="signal" />
      </div>
    ),
  },
] as const;

export function AboutPrinciples() {
  return (
    <Chapter index="02" labelledBy="principles-title" tone="tint">
      <ChapterHead
        id="principles-title"
        label="How it is run"
        title="Four rules the record keeps."
        align="end"
      />
      <ol data-rows className="mt-14 border-t border-line">
        {PRINCIPLES.map((principle) => (
          <li
            key={principle.title}
            className="grid gap-6 border-b border-line py-8 lg:grid-cols-[16rem_1fr_18rem] lg:gap-12"
          >
            <h3 className="font-display text-h2">{principle.title}</h3>
            <p className="max-w-[40rem] text-body text-sec">{principle.body}</p>
            <div className="border border-line bg-bg p-4">{principle.figure}</div>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
