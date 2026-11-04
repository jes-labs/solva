import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Cell, Provenance, RuledGrid, ledgerLabel } from "@/components/ui/ledger";
import { StatusTag } from "@/components/ui/status-tag";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { ResultMeanings } from "./result-meanings";
import { UpdateCadence } from "./update-cadence";

interface Fact {
  label: string;
  value: string;
}

function Facts({ items }: { items: readonly Fact[] }) {
  return (
    <dl className="border-t border-line">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 border-b border-line py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4"
        >
          <dt className="text-small font-medium text-sec">{item.label}</dt>
          <dd className="text-small text-text">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EvidenceLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-1 font-mono text-small break-all underline decoration-link-line underline-offset-4 hover:decoration-text"
    >
      {children}
      <ArrowUpRightIcon aria-hidden="true" className="size-3 shrink-0" />
    </a>
  );
}

export function BalancesDetail() {
  return (
    <Facts
      items={[
        {
          label: "For an anchor",
          value:
            "What is owed is a stored list of holder balances that add up to the supply. Reading the token supply straight from Stellar at the record's ledger is coming soon.",
        },
        {
          label: "For a custodial app",
          value: "What is owed is the list of customer balances the app commits that day.",
        },
        {
          label: "Published",
          value:
            "Nothing from the list. Today Solva holds the list and passes it to its prover over a private connection; no balance is written anywhere public.",
        },
      ]}
    />
  );
}

export function CommitDetail() {
  return (
    <Facts
      items={[
        {
          label: "Commitment",
          value:
            "One value that stands for the whole list and its total. Change a single balance, and the commitment changes with it.",
        },
        {
          label: "Published",
          value: "The commitment and the total. Never the list.",
        },
        {
          label: "Holder check",
          value:
            "A customer can confirm that their own balance sits behind the commitment. No other customer is named; the path shows unnamed subtotals, including one neighbouring balance.",
        },
      ]}
    />
  );
}

export function ProofDetail() {
  return (
    <Facts
      items={[
        {
          label: "What it proves",
          value:
            "Every balance on the list was counted, none is negative, and the total is at most the signed balance of the reserve accounts.",
        },
        {
          label: "What it publishes",
          value:
            "Only the totals and the commitment. No balance is a public input. The proof system's hiding mode is in development.",
        },
        {
          label: "Who checks it",
          value:
            "A contract on Stellar. Solva never checks its own work. The next step shows the contract on Testnet.",
        },
        {
          label: "The detail",
          value:
            "How the proof is built is set out in the documentation, alongside the source code.",
        },
      ]}
    />
  );
}

export function VerifyDetail() {
  return (
    <div>
      <RuledGrid columns={2} className="bg-bg">
        <Cell
          label="Verifier contract"
          value={
            <EvidenceLink href={explorer.contract(verifierEvidence.contractId)}>
              {shortHash(verifierEvidence.contractId, 10, 6)}
            </EvidenceLink>
          }
          note={`Stellar ${verifierEvidence.network}`}
        />
        <Cell
          label="Verified transaction"
          value={
            <EvidenceLink href={explorer.tx(verifierEvidence.verifyTx)}>
              {shortHash(verifierEvidence.verifyTx, 10, 6)}
            </EvidenceLink>
          }
          note={ledgerLabel(verifierEvidence.verifiedAtLedger)}
        />
        <Cell
          label="Ledger"
          value={verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}
          note="where the contract checked the proof"
        />
        <Cell
          label="Fee"
          value={verifierEvidence.feeXlm}
          note={`XLM, ${verifierEvidence.feeStroops.toLocaleString("en-US")} stroops`}
        />
      </RuledGrid>
      <Facts
        items={[
          {
            label: "Who is trusted",
            value:
              "Nobody. The contract checks the proof itself, on the network. Anyone can open the transaction where it was verified and rerun the open-source verifier on the same proof.",
          },
          {
            label: "Outcome",
            value:
              "A proof that fails to verify writes nothing. Reserves below what is owed produce no proof at all, so a shortfall can never be written as covered. A proof that verifies stores both totals at that ledger.",
          },
        ]}
      />
      <Provenance
        parts={[`Stellar ${verifierEvidence.network}`, "Links open stellar.expert"]}
        className="mt-4"
      />
    </div>
  );
}

export function RecordDetail() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="flex flex-wrap items-center gap-3 text-small font-medium text-sec">
          Three states, nothing in between
          <StatusTag status="coming-soon" />
        </p>
        <div className="mt-3">
          <ResultMeanings />
        </div>
      </div>
      <div>
        <p className="text-small font-medium text-sec">Cadence</p>
        <p className="mt-1 text-small text-sec">
          Designed to run daily by default, or on the schedule the institution agrees. Each result
          names a Stellar ledger, so it carries a time anyone can look up. When a proof does not
          arrive on schedule, the record will turn stale by itself. Scheduled publishing and
          freshness checks are coming soon; on Testnet today a cycle runs on request.
        </p>
        <div className="mt-4">
          <UpdateCadence />
        </div>
      </div>
    </div>
  );
}
