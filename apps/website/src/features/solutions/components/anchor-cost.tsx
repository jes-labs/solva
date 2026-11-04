import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { CostFigures } from "./cost-figures";

export function AnchorCost() {
  return (
    <Chapter id="what-it-costs" index="04" labelledBy="anchor-cost-title">
      <ChapterHead
        id="anchor-cost-title"
        label="What it costs"
        title="Free to read, a fraction of a cent to verify."
        lead="Reading a record costs nothing and needs no account. Verifying one on Stellar costs a small network fee. The terms of a pilot are agreed with each anchor before the first proof."
      />
      <div className="mt-14">
        <CostFigures />
      </div>
    </Chapter>
  );
}
