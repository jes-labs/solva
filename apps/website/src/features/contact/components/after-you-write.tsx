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
    body: "We connect your reserve source and publish the first proof. Your holders can read the result the same day.",
  },
];

export function AfterYouWrite() {
  return <NextSteps id="after" label="Next" title="What happens after you write." steps={STEPS} />;
}
