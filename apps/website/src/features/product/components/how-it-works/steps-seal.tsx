import { Provenance, ledgerLabel } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { exampleRecords } from "@/lib/example-records";

const latest = exampleRecords[0];
const STEPS = 5;

export function StepsSeal() {
  return (
    <figure className="min-w-0 lg:justify-self-end">
      <SealInstrument
        mode="progress"
        step={STEPS}
        steps={STEPS}
        title="Five steps complete and a record written"
        className="mx-auto w-64 sm:w-80 lg:w-[22rem]"
      >
        <span className="font-display text-h2">Record</span>
        <span className="mt-2 text-small text-sec">
          Step {STEPS} of {STEPS}
        </span>
      </SealInstrument>
      <figcaption className="mt-5 flex flex-col items-center gap-2 text-center lg:items-end lg:text-right">
        <p className="font-display text-h3">
          {latest.institution}
          <span className="text-sec"> · {latest.asset}</span>
        </p>
        <Provenance
          parts={["Example", ledgerLabel(latest.ledger), "One proof per asset per day"]}
        />
      </figcaption>
    </figure>
  );
}
