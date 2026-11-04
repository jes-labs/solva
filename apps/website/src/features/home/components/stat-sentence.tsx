import { exampleRecords } from "@/lib/example-records";
import { wholeUnits, type SupplySnapshot } from "@/lib/stellar-supply";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six"] as const;

function count(state: "covered" | "short" | "stale") {
  return exampleRecords.filter((record) => record.state === state).length;
}

function word(n: number) {
  return WORDS[n] ?? String(n);
}

interface StatSentenceProps {
  snapshot: SupplySnapshot | null;
}

export function StatSentence({ snapshot }: StatSentenceProps) {
  const latest = exampleRecords.reduce((a, b) => (a.ledger > b.ledger ? a : b));
  const lead = snapshot?.rows[0];
  return (
    <section
      aria-label="The registry in two sentences"
      data-rows
      className="grid gap-8 border-t border-line px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-12"
    >
      <p className="max-w-[36rem] font-display text-[1.25rem] leading-[1.45] text-sec sm:text-[1.5rem]">
        <span className="text-small font-medium text-sec">On Stellar right now</span>
        <br />
        {lead && snapshot ? (
          <>
            <span className="text-text num">
              {wholeUnits(lead.supply)} {lead.asset.code}
            </span>{" "}
            is in circulation, with{" "}
            <span className="text-text num">{lead.holders.toLocaleString("en-US")} accounts</span>{" "}
            set up to hold it, read at ledger{" "}
            <span className="text-text num">{snapshot.ledger.toLocaleString("en-US")}</span>. The
            supply is public. Whether reserves cover it is what a record proves.
          </>
        ) : (
          <>
            A token&rsquo;s supply is public on the ledger. What backs it usually is not. A record
            puts the two side by side, every day.
          </>
        )}
      </p>
      <p className="max-w-[36rem] font-display text-[1.25rem] leading-[1.45] text-sec sm:text-[1.5rem]">
        <span className="text-small font-medium text-sec">Example registry</span>
        <br />
        <span className="text-text num">{word(exampleRecords.length)} records</span> for{" "}
        <span className="text-text num">{word(exampleRecords.length)} assets</span>:{" "}
        <span className="text-text num">{word(count("covered"))} covered</span>,{" "}
        <span className="text-text num">{word(count("short"))} short</span>,{" "}
        <span className="text-text num">{word(count("stale"))} stale</span>. The latest was checked
        at ledger <span className="text-text num">{latest.ledger.toLocaleString("en-US")}</span>,
        and each one costs about <span className="text-text num">0.012 XLM</span> to verify.
      </p>
    </section>
  );
}
