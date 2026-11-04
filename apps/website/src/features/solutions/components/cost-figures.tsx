import { Cell, Provenance, RuledGrid, ledgerLabel } from "@/components/ui/ledger";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";

const FIGURES = [
  {
    label: "To read a record",
    value: "Free",
    note: "Holders, wallets, lending pools and auditors",
  },
  {
    label: "To verify one record on Stellar",
    value: "0.012 XLM",
    note: `${verifierEvidence.feeXlm} XLM · ${ledgerLabel(verifierEvidence.verifiedAtLedger)}`,
  },
  {
    label: "To publish",
    value: "Pilot terms",
    note: "Agreed with each institution before the first proof",
  },
] as const;

export function CostFigures() {
  return (
    <div>
      <RuledGrid columns={3}>
        {FIGURES.map((figure) => (
          <Cell key={figure.label} label={figure.label} value={figure.value} note={figure.note} />
        ))}
      </RuledGrid>
      <Provenance
        className="mt-6"
        parts={[
          <a
            key="tx"
            href={explorer.tx(verifierEvidence.verifyTx)}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line-strong underline-offset-4 hover:decoration-text"
          >
            Verified transaction {shortHash(verifierEvidence.verifyTx)}
          </a>,
          `Stellar ${verifierEvidence.network}`,
          `Protocol ${verifierEvidence.protocol}`,
        ]}
      />
    </div>
  );
}
