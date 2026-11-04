import { NextSteps, type NextStep } from "./next-steps";

const STEPS: readonly NextStep[] = [
  {
    title: "We read every request",
    body: "A person on the team replies from hello@joinsolva.xyz, usually to arrange a short call.",
  },
  {
    title: "Pilot partners open first",
    body: "Anchors and custodial apps in a pilot publish before anyone else. Each group after that is invited by email.",
  },
  {
    title: "Your entry goes on the record",
    body: "Your team signs in with a passkey, connects your reserve source and publishes the first proof. Holders read the result for free.",
  },
];

export function WaitlistNext() {
  return (
    <NextSteps
      id="next"
      label="Next"
      title="What happens after you join."
      lead="Your request goes straight to the team. When publishing opens to your organisation, we write to the address you gave us. Nobody else sees it."
      steps={STEPS}
    />
  );
}
