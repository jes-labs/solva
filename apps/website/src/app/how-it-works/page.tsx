import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { routes } from "@/config/navigation";
import { FurtherReading, NeverDoes, Steps, StepsSeal } from "@/features/product";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Solva turns reserves into a public coverage record on Stellar: a list of balances, one commitment, a proof, a contract check, and a record anyone can read.",
  alternates: { canonical: routes.howItWorks },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageOpening
        label="How it works"
        title="How a coverage record is made."
        lead="Solva measures what an anchor or custodial app holds against what it owes, asks a contract on Stellar to check the proof, and writes the result where anyone can read it. Five steps for every asset, designed to run every day. Scheduled daily publishing is coming soon; on Testnet today a cycle runs on request."
        primary={{ label: "See it work", href: routes.demo }}
        secondary={{ label: "Talk to us", href: routes.contact }}
        figure={<StepsSeal />}
      />
      <Steps />
      <NeverDoes />
      <FurtherReading />
      <Close />
    </>
  );
}
