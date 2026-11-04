import { SolutionFaq } from "./solution-faq";

const ITEMS: readonly { question: string; answer: string }[] = [
  {
    question: "Do you publish our customers' balances?",
    answer:
      "No. Solva publishes the total you owe customers, your reserve balance and the result. No customer is named and no list of balances is published. A customer's own check shows unnamed subtotals, including one neighbouring balance.",
  },
  {
    question: "What does a customer need to run the check?",
    answer:
      "Their account reference, which you already show them in your app. The check tells them that their balance was counted and which total it is part of.",
  },
  {
    question: "What if a customer's balance is missing?",
    answer:
      "The check says so plainly, and the customer can raise it with you. Catching a missing balance is the whole reason the check exists.",
  },
  {
    question: "How many customers can one proof cover?",
    answer:
      "Today a proof covers up to 8 customer balances and 4 reserve figures. Proofs over your full customer list are coming soon, and each proof will then cover every customer you hold the asset for.",
  },
  {
    question: "What does our auditor get?",
    answer:
      "A dated result for every proof, each tied to a Stellar ledger, including the totals your customers check against: evidence to check between audits. Daily history and a CSV export are coming soon.",
  },
  {
    question: "What does it cost?",
    answer:
      "Reading is free for everyone. Verifying a result costs about 0.012 XLM in Stellar network fees. Pilot terms are agreed with each institution before the first proof.",
  },
];

export function CustodyFaq() {
  return (
    <SolutionFaq
      id="custody-faq-title"
      index="04"
      title="Questions custodial apps ask"
      items={ITEMS}
    />
  );
}
