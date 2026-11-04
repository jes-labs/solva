import type { ReactNode } from "react";
import { Cell, Provenance, RuledGrid } from "@/components/ui/ledger";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { site } from "@/config/site";
import { TrustContents, type TrustEntry } from "./trust-contents";

export const TRUST_VERSION = { number: 2, iso: "2026-11-04", label: "4 November 2026" } as const;

const TRUST_CONTENTS: readonly TrustEntry[] = [
  { id: "proven", title: "What the proof establishes" },
  { id: "attested", title: "What comes from outside the proof" },
  { id: "not-proven", title: "What no record claims" },
  { id: "assumptions", title: "Who has to be honest" },
  { id: "verifier", title: "The verifier on Stellar" },
  { id: "status", title: "Status and the audit" },
  { id: "security", title: "How the entry is protected" },
  { id: "corrections", title: "Corrections" },
  { id: "changes", title: "Changes to this page" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-line py-10 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-title`} className="font-display text-h2">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-4 text-[1.0625rem] leading-[1.65] text-sec [&_a]:text-link [&_a]:underline [&_a]:decoration-link-line [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-text">
        {children}
      </div>
    </section>
  );
}

function Rows({ items }: { items: readonly string[] }) {
  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <li key={item} className="flex gap-4 border-b border-line py-3">
          <span aria-hidden="true" className="mt-2.5 h-0.5 w-4 shrink-0 bg-line-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TrustDocument() {
  return (
    <div className="grid gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:px-12">
      <div>
        <TrustContents entries={TRUST_CONTENTS} />
      </div>
      <article className="min-w-0 max-w-[44rem]">
        <Section id="proven" title="What the proof establishes">
          <p>
            Each record rests on one proof, and a contract on Stellar checks that proof before the
            record is written. When the contract accepts a proof, the proof has established all of
            the following at the ledger it names:
          </p>
          <Rows
            items={[
              "Every balance in the committed list was counted, and none of them is negative.",
              "The total of the list is at most the reserve balance that the proof was given.",
              "The commitment written in the record stands for exactly that list, so nothing can be left out or changed later without the commitment changing too.",
              "Any holder who asks can be shown that their own balance is in the list. The check shows no names; it does show unnamed subtotals of nearby entries, including one neighbouring balance.",
            ]}
          />
          <p>
            Today, for every institution, the list is a stored list of balances. For an anchor, it
            is the balances of the token holders. For a custodial app, it is its customer balances.
            Using an anchor&apos;s supply read from Stellar in the proof is coming soon.
          </p>
          <p>
            One point of precision about the words zero-knowledge. The prover and verifier running
            on Testnet today keep every balance out of the public inputs, but the proof is not yet
            in its formally hiding configuration. That configuration is in development, and this
            page will say so when it ships.
          </p>
        </Section>

        <Section id="attested" title="What comes from outside the proof">
          <p>
            A proof is only as good as its inputs. Two inputs come from outside the proof, and the
            proof cannot vouch for them:
          </p>
          <Rows
            items={[
              "The reserve balance. For reserves held with a custodian, it is a statement from the accounts that hold them, signed by that source and read at the time of the proof; Solva records which source signed, and when. For reserves held in Stellar accounts, Solva reads the balance from the ledger itself, which anyone can check.",
              "The committed list. The institution supplies it, and today Solva's orchestrator holds it and passes it to the prover. The proof guarantees that the list was counted in full, but it cannot know whether a balance was left out before the list reached the prover. That is what the holder check is for.",
            ]}
          />
          <p>
            In the public demo, the custodian is a stand-in run by Solva, except for Harbor Wallet,
            whose reserves are read from its Stellar account. The demo names the reserve source on
            every run.
          </p>
        </Section>

        <Section id="not-proven" title="What no record claims">
          <Rows
            items={[
              "That reserves held with a custodian exist beyond its signed statement.",
              "For reserves read from Stellar, anything beyond the balance of the account. The record does not judge the asset held in it.",
              "That an institution is sound in any sense other than coverage at one ledger. A record is evidence for your auditor. It does not replace an audit, and it never will.",
              "Anything about a day with no record. Writing a missed day as stale is coming soon.",
              "That the reserve figure is private. No balance in the list is published, but the reserve total and the result are public by design.",
            ]}
          />
        </Section>

        <Section id="assumptions" title="Who has to be honest">
          <p>
            The prover does not have to be. Solva runs the prover today, and a dishonest prover
            still cannot produce a proof that the contract accepts. The total is whatever the proof
            computes, whatever the prover claims. Running the prover inside the institution&apos;s
            own infrastructure is coming soon.
          </p>
          <p>
            The reserve source has to be. If a custodian&apos;s signed statement is wrong, the
            record is wrong, which is why Solva logs which source signed, and when. Reserves held in
            Stellar accounts are read from the ledger, so anyone can compare that balance with the
            record.
          </p>
          <p>
            The list has to be complete. An institution could leave a customer out of the list
            before proving. The defence is the holder check: a customer who is not in the list will
            fail it, and a pattern of failed checks is visible to everyone.
          </p>
          <p>
            Stale will be applied by rule, with no judgement involved: a record turns stale when no
            new proof arrives inside the expected window, daily by default. Freshness checks are
            coming soon; today each record carries its timestamp, so a reader can judge its age. How
            old a record may be before a reader stops relying on it is the reader&apos;s own
            decision.
          </p>
        </Section>

        <Section id="verifier" title="The verifier on Stellar">
          <p>
            The contract that checks proofs runs on Stellar Testnet today. Before building the
            registry on it, we deployed the reference verifier unchanged and ran a known-good proof
            through it, then a proof with a single byte altered, which it rejected.
          </p>
          <RuledGrid columns={2}>
            <Cell
              label="Verifier contract"
              value={
                <a
                  href={explorer.contract(verifierEvidence.contractId)}
                  className="num underline underline-offset-4"
                >
                  {shortHash(verifierEvidence.contractId, 8, 6)}
                </a>
              }
              note={`Code hash ${shortHash(verifierEvidence.wasmHash, 8, 6)}`}
            />
            <Cell
              label="A verified proof"
              value={
                <a
                  href={explorer.tx(verifierEvidence.verifyTx)}
                  className="num underline underline-offset-4"
                >
                  {shortHash(verifierEvidence.verifyTx, 8, 6)}
                </a>
              }
              note={`Ledger ${verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}`}
            />
            <Cell
              label="Fee per verification"
              value={`${verifierEvidence.feeXlm} XLM`}
              note={`${verifierEvidence.feeStroops.toLocaleString("en-US")} stroops, identical on a second run`}
            />
            <Cell
              label="Network"
              value={`Stellar ${verifierEvidence.network}`}
              note={`Protocol ${verifierEvidence.protocol}. No mainnet contract yet.`}
            />
          </RuledGrid>
        </Section>

        <Section id="status" title="Status and the audit">
          <Rows
            items={[
              "Everything on this site runs on Stellar Testnet. No mainnet contract is deployed.",
              "The proof system, the prover and the contract have not had a security audit. Mainnet comes after the audit, never before it.",
              "In the public demo, two example institutions prove against a stand-in custodian run by Solva, and a third, Harbor Wallet, proves against real Testnet USDC read from its Stellar account. The customer lists in the demo are example data. Pilot records with real reserve sources are agreed with each institution.",
              "Example records on this site are labelled as examples and are not read from any contract. The demo is the exception: its record step and holder check run against each institution's contract on Stellar Testnet.",
            ]}
          />
        </Section>

        <Section id="security" title="How the entry is protected">
          <Rows
            items={[
              "An institution's entry is owned by a passkey its team holds, with no raw owner key to copy or leak. The passkey grants Solva's orchestrator a scoped publishing key that can publish proofs to that registry only. The passkey stays the owner and can revoke that key at any time.",
              "No customer balance is ever written anywhere public. Today the customer list is held by Solva's orchestrator and passed to the prover, which runs on Solva's side, over a private connection. Only the proof, the commitment and the totals reach Stellar.",
              "Every line of the prover, the contract and this site is open source under Apache 2.0.",
              `To report a security problem, write to ${site.securityEmail}. We answer every report and credit the reporter.`,
            ]}
          />
        </Section>

        <Section id="corrections" title="Corrections">
          <p>
            A record is never edited. If an institution believes a record is wrong, it writes to{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>, and the next proof
            supersedes it. Correction notes that name the record they correct are coming soon.
          </p>
        </Section>

        <Section id="changes" title="Changes to this page">
          <Provenance parts={[`Version ${TRUST_VERSION.number}`, TRUST_VERSION.label, "Revised"]} />
        </Section>
      </article>
    </div>
  );
}
