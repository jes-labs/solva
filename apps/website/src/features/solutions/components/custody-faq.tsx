import { SolutionFaq } from "./solution-faq";

const ITEMS: readonly { question: string; answer: string }[] = [
  {
    question: "Do you publish our customers' balances?",
    answer:
      "No. Solva publishes the total you owe customers, your reserve balance and the result. No list of balances is published, and each customer can check only their own.",
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
      "Every customer you hold the asset for. One proof covers the full list of balances, so the total your customers check against is the whole of what you owe in that asset.",
  },
  {
    question: "What does our auditor get?",
    answer:
      "A dated result for every day, each tied to a Stellar ledger, including the totals your customers check against. Daily evidence to check between audits.",
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
