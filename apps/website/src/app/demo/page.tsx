import type { Metadata } from "next";
import { Close } from "@/components/layout/close";
import { PageOpening } from "@/components/layout/page-opening";
import { Provenance, LeaderRow } from "@/components/ui/ledger";
import { routes } from "@/config/navigation";
import { verifierEvidence } from "@/config/evidence";
import { RealCheck, Sandbox, StepNotes } from "@/features/product";

export const metadata: Metadata = {
  title: "See it work",
  description:
    "Run a real proof of reserve coverage on Stellar Testnet, step by step: signed reserve balance, commitment, proof, contract check and the inclusion path a holder uses to confirm they were counted.",
  alternates: { canonical: routes.demo },
};

function RunFigure() {
  return (
    <div className="ruled-marks relative border border-line bg-bg p-5 sm:p-6">
      <p className="text-small text-sec">What one run produces</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <LeaderRow label="Proof" value="One, checked on Stellar" />
        <LeaderRow label="Balances published" value="0" />
        <LeaderRow label="Published to" value="the institution's contract" />
        <LeaderRow label="Checked by" value="Soroban, Testnet" />
        <LeaderRow label="Fee" value={`${verifierEvidence.feeXlm} XLM`} tone="signal" />
      </div>
      <Provenance parts={["Real pipeline", "Sandbox and on-chain reserves"]} className="mt-5" />
    </div>
  );
}

export default function DemoPage() {
  return (
    <>
      <PageOpening
        label="See it work"
        title="Run a real proof on Stellar."
        lead="A signed reserve balance, a commitment to what is owed, a proof, a contract on Stellar Testnet that checks it, and the inclusion path a holder uses to confirm they were counted. Two example institutions use Solva's sandbox as the custodian; a third, Harbor Wallet, holds real Testnet USDC read from Stellar. Everything after the reserve source is the same code a pilot runs."
        primary={{ label: "Start the run", href: "#run" }}
        secondary={{ label: "Talk to us about a pilot", href: routes.contact }}
        figure={<RunFigure />}
      />
      <Sandbox />
      <StepNotes />
      <RealCheck />
      <Close
        institutions={{
          title: "Run this on your own reserves.",
          body: "Pilots are open to anchors and custodial apps on Stellar. Tell us about your asset and we will plan your first real record with you.",
        }}
      />
    </>
  );
}
