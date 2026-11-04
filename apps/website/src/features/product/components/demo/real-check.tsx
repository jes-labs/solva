import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { RecordDocument } from "@/components/ui/record-document";
import { exampleRecords } from "@/lib/example-records";

const DIFFERENCES = [
  {
    title: "Your own reserve source",
    body: "A pilot reads the signed balance of the accounts that hold your reserves. On this page the sandbox stands in for that source. Everything after it is the same code.",
  },
  {
    title: "Supply read from Stellar",
    body: "For an anchor, what is owed is the token's supply at the ledger of the check, read straight from Stellar. Nobody types it in.",
  },
  {
    title: "Every day, on a schedule",
    body: "A pilot runs these steps once a day by default. A missed day is written as stale and never filled in afterwards.",
  },
] as const;

export function RealCheck() {
  return (
    <Chapter index="03" labelledBy="real-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <ChapterHead
            id="real-title"
            label="From the sandbox to a pilot"
            title="Three things change in a pilot. The proof stays the same."
          />
          <ol data-rows className="mt-10 border-t border-line">
            {DIFFERENCES.map((item) => (
              <li key={item.title} className="border-b border-line py-5">
                <h3 className="font-display text-h3">{item.title}</h3>
                <p className="mt-2 max-w-[36rem] text-body text-sec">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <RecordDocument record={exampleRecords[1]} caption="What a pilot writes" />
      </div>
    </Chapter>
  );
}
