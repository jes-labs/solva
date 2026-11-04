import type { Metadata } from "next";
import { PageOpening } from "@/components/layout/page-opening";
import { RecordDocument } from "@/components/ui/record-document";
import { exampleRecords } from "@/lib/example-records";
import { PictureCredits } from "@/components/layout/picture-credits";
import { LegalDocument } from "@/features/legal";

export const metadata: Metadata = {
  title: "Terms and privacy",
  description:
    "The terms for using joinsolva.xyz, what our forms collect, why we keep it, for how long, and who processes it for us.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <>
      <PageOpening
        label="Legal"
        title="Terms and privacy."
        lead="How you may use this site, what our two forms collect, why we keep it, for how long, and who handles it for us."
        primary={{ label: "See what our forms collect", href: "#what-we-collect" }}
        figure={
          <RecordDocument
            record={exampleRecords[3]}
            variant="compact"
            caption="Example, a stale day"
          />
        }
        provenance={["Plain English", "No analytics, no tracking cookies"]}
      />
      <LegalDocument />
      <PictureCredits />
    </>
  );
}
