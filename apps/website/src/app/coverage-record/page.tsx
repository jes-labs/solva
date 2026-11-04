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
    "Each institution's registry on Stellar holds what is owed, what is held and the ledger each proof was checked at, free for holders, wallets, lending pools and auditors to read.",
  alternates: { canonical: routes.coverageRecord },
};

export default function CoverageRecordPage() {
  return (
    <>
      <PageOpening
        label="The coverage record"
        title="What everyone sees."
        lead="Every institution has its own registry contract on Stellar holding what is owed, what is held and the ledger each proof was checked at. Public record pages, like this example for Kestrel Anchor's ARSK shown at full size, are coming soon."
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
