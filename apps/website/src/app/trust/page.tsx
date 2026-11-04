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
    "What a Solva coverage record proves, what comes from outside the proof, what no record claims, who has to be honest, and the verifier contract on Stellar Testnet.",
  alternates: { canonical: routes.trust },
};

export default function TrustPage() {
  return (
    <>
      <PageOpening
        label="Trust"
        title="What a record proves, and what it does not."
        lead="Written for the person who has to sign off on relying on a record. Every claim on this page has a stated limit, and the verifier that checks each proof is linked, so anyone can open the transaction where the contract verified it and rerun the open-source verifier on the same proof."
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
          title: "Evidence for the audit file.",
          body: "Read a record the way an auditor would: the ledger, the proof and the verifier. Daily history and a CSV export for the audit file are coming soon.",
          action: { label: "The coverage record", href: routes.coverageRecord },
        }}
      />
    </>
  );
}
