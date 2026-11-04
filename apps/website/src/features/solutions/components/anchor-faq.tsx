import { SolutionFaq } from "./solution-faq";

const ITEMS: readonly { question: string; answer: string }[] = [
  {
    question: "Do we report our token supply?",
    answer:
      "No. Solva reads it from Stellar, where it is already public. You report your reserve balance and nothing else.",
  },
  {
    question: "How often is a result made?",
    answer:
      "Once a day for each asset, on the schedule agreed during the pilot. A day with no proof shows as stale instead of repeating the last result.",
  },
  {
    question: "We issue more than one token. How does that work?",
    answer:
      "Each asset gets its own entry, its own daily result and its own public page. Nothing is blended across tokens.",
  },
  {
    question: "What do holders see if we come up short?",
    answer:
      "The page says short and shows the size of the gap. It returns to covered with the first proof that shows reserves at or above supply again.",
  },
  {
    question: "Can we link the page from our stellar.toml?",
    answer:
      "Yes. Each asset's page keeps a stable address, so you can link it from your stellar.toml, your site and your exchange listings.",
  },
  {
    question: "What does our auditor get?",
    answer:
      "A dated result for every day, each tied to a Stellar ledger: daily evidence to check between reports. Your auditor's own report stays where it is.",
  },
];

export function AnchorFaq() {
  return (
    <SolutionFaq id="anchor-faq-title" index="05" title="Questions anchors ask" items={ITEMS} />
  );
}
