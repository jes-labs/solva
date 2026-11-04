import { SolutionFaq } from "./solution-faq";

const ITEMS: readonly { question: string; answer: string }[] = [
  {
    question: "Do we report our token supply?",
    answer:
      "Not the supply itself. Today what is owed is a stored list of holder balances. Reading the supply from Stellar, where it is already public, is coming soon.",
  },
  {
    question: "How often is a result made?",
    answer:
      "Solva is designed to make one each day, on the schedule agreed during the pilot, with a day that has no proof showing as stale. Scheduled publishing is coming soon; on Testnet today a cycle runs on request.",
  },
  {
    question: "We issue more than one token. How does that work?",
    answer:
      "One registry per institution today. Separate records and public pages for each asset are coming soon, never a blended figure.",
  },
  {
    question: "What do holders see if we come up short?",
    answer:
      "No proof can be made, so nothing is published as covered. The contract only accepts a proof that reserves are at or above what is owed. A short status that shows the size of the gap is coming soon.",
  },
  {
    question: "Can we link the page from our stellar.toml?",
    answer:
      "Yes, once public record pages launch. Each asset's page will keep a stable address for your stellar.toml, your site and your exchange listings. Coming soon.",
  },
  {
    question: "What does our auditor get?",
    answer:
      "A dated result for every proof, each tied to a Stellar ledger: evidence to check between reports. Daily history and a CSV export are coming soon. Your auditor's own report stays where it is.",
  },
];

export function AnchorFaq() {
  return (
    <SolutionFaq id="anchor-faq-title" index="05" title="Questions anchors ask" items={ITEMS} />
  );
}
