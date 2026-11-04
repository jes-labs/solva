import { LeaderRow, Provenance, ledgerLabel } from "@/components/ui/ledger";
import { StateStamp } from "@/components/ui/state-stamp";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { exampleRecords } from "@/lib/example-records";

const record = exampleRecords[0];

const CALLS = [
  { language: "Rust", code: "registry.is_covered(&issuer, &asset)" },
  { language: "TypeScript", code: "await registry.is_covered({ issuer, asset })" },
] as const;

export function IsCoveredFigure() {
  return (
    <figure className="ruled-marks relative border border-line bg-bg text-text">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="text-small text-sec">One call · planned registry interface</span>
        <StateStamp state={record.state} />
      </figcaption>
      <div className="px-5 py-5">
        {CALLS.map((call, index) => (
          <div key={call.language} className={index > 0 ? "mt-5" : undefined}>
            <p className="text-small font-medium text-sec">{call.language}</p>
            <pre className="mt-2 overflow-x-auto font-mono text-small leading-relaxed text-text">
              <code>{call.code}</code>
            </pre>
          </div>
        ))}
        <div className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5">
          <LeaderRow label="Returns" value="covered · short · stale" />
          <LeaderRow label="Checked at" value={ledgerLabel(record.ledger)} />
          <LeaderRow label="Cost to read" value="Free" tone="signal" />
          <LeaderRow label="Today" value="get_latest_proof(), get_proof(id)" />
        </div>
      </div>
      <footer className="border-t border-line px-5 py-3">
        <Provenance
          parts={[
            <a
              key="contract"
              href={explorer.contract(verifierEvidence.contractId)}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line-strong underline-offset-4 hover:decoration-text"
            >
              Verifier {shortHash(verifierEvidence.contractId)}
            </a>,
            `Stellar ${verifierEvidence.network}`,
            `Protocol ${verifierEvidence.protocol}`,
          ]}
        />
      </footer>
    </figure>
  );
}
