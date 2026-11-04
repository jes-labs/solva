import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { RecordDocument } from "@/components/ui/record-document";
import { routes } from "@/config/navigation";
import { exampleRecords } from "@/lib/example-records";
import { RecordHistory, RecordReaders, RecordSheet } from "@/features/product";

export const metadata: Metadata = {
  title: "The coverage record",
  description:
    "One public record per asset on Stellar: what is owed, what is held, the state and every day's result, read by holders, wallets, lending pools and auditors.",
  alternates: { canonical: routes.coverageRecord },
};

export default function CoverageRecordPage() {
  return (
    <>
      <PageOpening
        label="The coverage record"
        title="What everyone sees."
        lead="Every asset has one public record on Stellar: what is owed, what is held, its state and the ledger it was checked at. This is an example record for Kestrel Anchor's ARSK, shown at full size."
        primary={{ label: "See it work", href: routes.demo }}
        secondary={{ label: "Talk to us", href: routes.contact }}
        figure={<RecordDocument record={exampleRecords[0]} />}
        wide
      />
      <RecordSheet />
      <RecordHistory />
      <RecordReaders />
      <Close
        readers={{
          title: "Watch a record being made.",
          body: "Run the pipeline against Stellar Testnet and watch the contract check the proof before the record is written.",
          action: { label: "See it work", href: routes.demo },
        }}
      />
    </>
  );
}
