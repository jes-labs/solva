import Link from "next/link";
import { FaqList } from "@/components/ui/faq-list";
import { Chapter, ChapterHead } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";

const QUESTIONS: readonly { question: string; answer: string }[] = [
  {
    question: "Is Solva an audit?",
    answer:
      "No. Solva is not an audit, and it does not stand in for one. It is a public record of whether reserves covered what was owed at a given ledger. Your auditor gets daily evidence to check between audits, and the audit itself stays where it is.",
  },
  {
    question: "What do we have to share?",
    answer:
      "Your reserve balance for each asset, signed by the account that holds it. Anchors share nothing else, because the token supply is already public on Stellar. Custodial apps also commit to their customer balances, which are never published one by one.",
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
      "The record says short and shows the size of the gap. Nothing is hidden, and the percentage is never rounded up. It returns to covered with the next proof that shows reserves at or above what is owed.",
  },
  {
    question: "What does stale mean?",
    answer:
      "No new proof arrived inside the expected window. Readers treat the asset as unknown until the next proof lands.",
  },
  {
    question: "Where does this run today?",
    answer:
      "On Stellar Testnet, ahead of a security audit. The verifier contract, a verified proof and its fee are linked at the bottom of every page. Mainnet follows the audit.",
  },
  {
    question: "How is our entry protected?",
    answer:
      "Your entry is controlled by a passkey your team holds on its own devices. There is no secret key that could be copied or leaked.",
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
                Not here?{" "}
                <Link
                  href={routes.contact}
                  className="text-text underline decoration-link-line underline-offset-4"
                >
                  Ask us directly
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
