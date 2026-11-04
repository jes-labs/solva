import { NextSteps, type NextStep } from "./next-steps";

const STEPS: readonly NextStep[] = [
  {
    title: "You get a confirmation",
    body: "Your address is saved once on the waitlist, and a confirmation goes to it straight away. Reply to that email to talk about a pilot sooner.",
  },
  {
    title: "Pilot partners open first",
    body: "Anchors and custodial apps in a pilot publish before anyone else. Each group after that is invited by email.",
  },
  {
    title: "Your entry goes on the record",
    body: "Your team signs in with a passkey, connects your reserve source and publishes the first proof. Self-serve onboarding is coming soon; pilot partners are set up with the team.",
  },
];

export function WaitlistNext() {
  return (
    <NextSteps
      id="next"
      label="Next"
      title="What happens after you join."
      lead="We keep your address on the waitlist and use it only to invite you to publish. When publishing opens to your organisation, we write to it."
      steps={STEPS}
    />
  );
}
