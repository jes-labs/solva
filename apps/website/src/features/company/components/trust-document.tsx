import type { ReactNode } from "react";
import { Cell, Provenance, RuledGrid } from "@/components/ui/ledger";
import { explorer, shortHash, verifierEvidence } from "@/config/evidence";
import { site } from "@/config/site";
import { TrustContents, type TrustEntry } from "./trust-contents";

export const TRUST_VERSION = { number: 1, iso: "2026-11-03", label: "3 November 2026" } as const;

const TRUST_CONTENTS: readonly TrustEntry[] = [
  { id: "proven", title: "What the proof establishes" },
  { id: "attested", title: "What rests on a signature" },
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
            Each record rests on one zero-knowledge proof, and a contract on Stellar checks that
            proof before the record is written. When the record says <strong>covered</strong>, the
            proof has established all of the following at the ledger it names:
          </p>
          <Rows
            items={[
              "Every balance in the committed list was counted, and none of them is negative.",
              "The total of the list is at most the reserve balance that the proof was given.",
              "The commitment written in the record stands for exactly that list, so nothing can be left out or changed later without the commitment changing too.",
              "Any holder who asks can be shown that their own balance is in the list, without seeing anyone else's.",
            ]}
          />
          <p>
            For an anchor, the list is the balances of the token holders, which add up to the supply
            Stellar already publishes. For a custodial app, the list is its customer balances.
          </p>
          <p>
            One point of precision about the words zero-knowledge. The prover and verifier running
            on Testnet today keep every balance out of the public inputs, but the proof is not yet
            in its formally hiding configuration. That configuration ships with the audited
            verifier, and this page will say so when it does.
          </p>
        </Section>

        <Section id="attested" title="What rests on a signature">
          <p>
            A proof is only as good as its inputs. Two inputs come from outside the proof. They are
            attested by a signature, and the proof cannot vouch for them:
          </p>
          <Rows
            items={[
              "The reserve balance. It is a statement from the accounts that hold the reserves, signed by that source and read at the time of the proof. Solva records which source signed, and when.",
              "The committed list. The institution supplies it. The proof guarantees that the list was counted in full, but it cannot know whether a balance was left out before the list reached the prover. That is what the holder check is for.",
            ]}
          />
          <p>
            Today the reserve source in the public sandbox is a stand-in run by Solva. A record from
            the sandbox is labelled as such.
          </p>
        </Section>

        <Section id="not-proven" title="What no record claims">
          <Rows
            items={[
              "That cash exists beyond the signed statement of the reserve accounts.",
              "That an institution is sound in any sense other than coverage at one ledger. A record is daily evidence for your auditor. It does not replace an audit, and it never will.",
              "Anything about a day with no record. A missed day is written as stale and stays that way.",
              "That the reserve figure is private. The proof hides every balance in the list, but the reserve total and the result are public by design.",
            ]}
          />
        </Section>

        <Section id="assumptions" title="Who has to be honest">
          <p>
            The prover does not have to be. The institution runs the prover on its own
            infrastructure, and a dishonest prover cannot produce a proof that the contract accepts.
            The total is whatever the proof computes, whatever the prover claims.
          </p>
          <p>
            The reserve source has to be. If the signed reserve statement is wrong, the record is
            wrong. That is why every record names the source and the time.
          </p>
          <p>
            The list has to be complete. An institution could leave a customer out of the list
            before proving. The defence is the holder check: a customer who is not in the list will
            fail it, and a pattern of failed checks is visible to everyone.
          </p>
          <p>
            Stale is applied by rule, with no judgement involved. Solva marks a record stale when no
            new proof arrives inside the expected window, daily by default. How old a record may be
            before a reader stops relying on it is the reader&apos;s own decision.
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
              "The public sandbox proves against a stand-in reserve source run by Solva and a small fixed list of balances. Pilot records with real reserve sources are agreed with each institution.",
              "Example records on this site are labelled as examples. They are not read from any contract.",
            ]}
          />
        </Section>

        <Section id="security" title="How the entry is protected">
          <Rows
            items={[
              "An institution's entry is controlled by a passkey its team holds. There is no raw key to copy or leak, and Solva cannot publish on an institution's behalf.",
              "No customer balance is ever sent to Solva or written anywhere public. The prover runs on the institution's side and produces only a proof and a commitment.",
              "Every line of the prover, the contract and this site is open source under Apache 2.0.",
              `Found a problem? Write to ${site.securityEmail}. We answer every report and credit the reporter.`,
            ]}
          />
        </Section>

        <Section id="corrections" title="Corrections">
          <p>
            A record is never edited. If an institution believes a record is wrong, it writes to{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. The correction is
            published as a new record with a note that names the one it corrects, and the note stays
            on this page.
          </p>
        </Section>

        <Section id="changes" title="Changes to this page">
          <Provenance
            parts={[`Version ${TRUST_VERSION.number}`, TRUST_VERSION.label, "First publication"]}
          />
        </Section>
      </article>
    </div>
  );
}
