import Link from "next/link";
import { FaqList } from "@/components/ui/faq-list";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";

const QUESTIONS: readonly { question: string; answer: string }[] = [
  {
    question: "Is Solva an audit?",
    answer:
      "No. Solva is not an audit, and it does not stand in for one. It is a public record of whether reserves covered what was owed at a given ledger. Your auditor gets dated evidence to check between audits, and the audit itself stays where it is.",
  },
  {
    question: "What do we have to share?",
    answer:
      "Your reserve balance for each asset, signed by the custodian that holds it, or read from Stellar for reserves held there. Custodial apps also commit to their customer balances, which are never published one by one. Today anchors do the same with their holder balances; reading the token supply straight from Stellar instead is coming soon.",
  },
  {
    question: "Who can read a result?",
    answer:
      "Anyone. Holders, wallets, lending pools and auditors read the record for free, without asking your permission.",
  },
  {
    question: "What does it cost to publish a result?",
    answer:
      "Reading a result is free for everyone. Verifying one on Stellar costs about 0.012 XLM in network fees. Pilot terms are agreed with each institution before the first proof.",
  },
  {
    question: "What happens if we come up short?",
    answer:
      "No proof can be made, so nothing is published as covered. The contract only accepts a proof that reserves are at or above what is owed. A short status that shows the gap publicly is coming soon.",
  },
  {
    question: "What does stale mean?",
    answer:
      "No new proof arrived inside the expected window. Readers treat the asset as unknown until the next proof lands. Stale statuses are coming soon; today each record carries its timestamp, so a reader can judge its age.",
  },
  {
    question: "Where does this run today?",
    answer:
      "On Stellar Testnet, ahead of a security audit. The verifier contract, a verified proof and its fee are linked at the bottom of every page. Mainnet follows the audit.",
  },
  {
    question: "How is our entry protected?",
    answer:
      "Your entry is owned by a passkey your team holds on its own devices, with no raw owner key to copy or leak. The passkey grants Solva a publishing key that can publish proofs to your registry only, and can revoke it at any time.",
  },
];

export function Questions() {
  return (
    <Chapter id="questions" index="06" labelledBy="questions-title" tone="tint">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ChapterHead
            id="questions-title"
            label="Questions"
            title="What institutions ask first."
            lead={
              <>
                For anything else,{" "}
                <Link
                  href={routes.contact}
                  className="text-text underline decoration-link-line underline-offset-4"
                >
                  ask us directly
                </Link>
                , and a person will reply within one working day.
              </>
            }
          />
        </div>
        <FaqList name="home-faq" items={QUESTIONS} />
      </div>
    </Chapter>
  );
}
