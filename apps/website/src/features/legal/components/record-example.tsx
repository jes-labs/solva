import { RecordDocument } from "@/components/ui/record-document";
import { exampleRecords } from "@/lib/example-records";

export function RecordExample() {
  const record = exampleRecords.find((entry) => entry.state === "stale");
  if (!record) {
    return null;
  }
  return (
    <figure className="my-4">
      <div className="max-w-[32rem]">
        <RecordDocument record={record} variant="compact" caption="Example, a stale day" />
      </div>
      <figcaption className="mt-3 max-w-[44rem] text-small text-sec">
        A record that has gone stale. It keeps the last proven figures in view and says plainly that
        no new proof has arrived.
      </figcaption>
    </figure>
  );
}
