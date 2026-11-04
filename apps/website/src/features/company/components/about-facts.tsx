import { Cell, Chapter, ChapterHead, Provenance, RuledGrid } from "@/components/ui/ledger";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { site } from "@/config/site";

export function AboutFacts() {
  return (
    <Chapter index="03" labelledBy="facts-title">
      <ChapterHead
        id="facts-title"
        label="What is true today"
        title="Open, on Testnet, and cheap to check."
        lead="These are the facts a reviewer can verify today. The rest of the site says what the product does. This section says where it stands."
      />
      <RuledGrid columns={4} className="mt-14">
        <Cell label="Source code" value="Open" note="Apache 2.0, on GitHub" />
        <Cell
          label="Network"
          value={verifierEvidence.network}
          note={`Protocol ${verifierEvidence.protocol}`}
        />
        <Cell
          label="One verification"
          value={`${verifierEvidence.feeXlm} XLM`}
          note="Measured on Testnet"
        />
        <Cell label="Security audit" value="Still ahead" note="Mainnet follows the audit" />
      </RuledGrid>
      <Provenance
        parts={[
          <a
            key="contract"
            href={explorer.contract(verifierEvidence.contractId)}
            className="underline underline-offset-4"
          >
            Verifier {shortHash(verifierEvidence.contractId, 8, 6)}
          </a>,
          <a
            key="tx"
            href={explorer.tx(verifierEvidence.verifyTx)}
            className="underline underline-offset-4"
          >
            Verified at ledger {verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}
          </a>,
          <a key="code" href={site.githubUrl} className="underline underline-offset-4">
            Source code on GitHub
          </a>,
        ]}
        className="mt-6"
      />
    </Chapter>
  );
}
