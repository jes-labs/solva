import { NextSteps, type NextStep } from "./next-steps";

const STEPS: readonly NextStep[] = [
  {
    title: "A person reads it and replies",
    body: "Your message lands in the team's own inbox, and the reply comes from hello@joinsolva.xyz within one working day.",
  },
  {
    title: "A short call to scope the pilot",
    body: "We go through which assets you issue or hold, where the reserves are held, and how often you want a proof published.",
  },
  {
    title: "Your first record, proven on Stellar",
    body: "We plan your reserve source together and publish your first proof on Stellar Testnet. Connections to real custodians and a public page for holders are coming soon.",
  },
];

export function AfterYouWrite() {
  return <NextSteps id="after" label="Next" title="What happens after you write." steps={STEPS} />;
}
