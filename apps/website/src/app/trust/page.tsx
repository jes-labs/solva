import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { RecordDocument } from "@/components/ui/record-document";
import { routes } from "@/config/navigation";
import { exampleRecords } from "@/lib/example-records";
import { TRUST_VERSION, TrustDocument } from "@/features/company";

export const metadata: Metadata = {
  title: "Trust",
  description:
    "What a Solva coverage record proves, what rests on a signature, what no record claims, who has to be honest, and the verifier contract on Stellar Testnet.",
  alternates: { canonical: routes.trust },
};

export default function TrustPage() {
  return (
    <>
      <PageOpening
        label="Trust"
        title="What a record proves, and what it does not."
        lead="Written for the person who has to sign off on relying on a record. Every claim on this page has a stated limit, and the verifier that checks each proof is linked so anyone can repeat the check."
        primary={{ label: "Start with what is proven", href: "#proven" }}
        secondary={{ label: "Ask a question", href: routes.contact }}
        figure={
          <RecordDocument
            record={exampleRecords[2]}
            variant="compact"
            caption="Example, a short day"
          />
        }
        provenance={[`Version ${TRUST_VERSION.number}`, TRUST_VERSION.label, "Stellar Testnet"]}
      />
      <TrustDocument />
      <Close
        readers={{
          label: "For auditors",
          title: "Daily evidence for the audit file.",
          body: "Read a record the way an auditor would: the ledger, the proof, the verifier and a year of history, one dated row per day.",
          action: { label: "The coverage record", href: routes.coverageRecord },
        }}
      />
    </>
  );
}
