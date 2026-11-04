"use client";

import type { ReactNode } from "react";
import { Chapter, ChapterHead, Provenance } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { verifierEvidence } from "@/config/evidence";
import { exampleRecords } from "@/lib/example-records";
import { cn } from "@/lib/utils";
import { useActiveStep } from "../../hooks/use-active-step";
import {
  BalancesDetail,
  CommitDetail,
  ProofDetail,
  RecordDetail,
  VerifyDetail,
} from "./step-details";
import {
  BalancesFigure,
  CommitFigure,
  ProofFigure,
  RecordFigure,
  VerifyFigure,
} from "./step-figures";

interface Step {
  id: string;
  title: string;
  lead: string;
  body: string;
  figure: ReactNode;
  provenance: readonly string[];
  detail: ReactNode;
}

const latest = exampleRecords[0];

const STEPS: readonly Step[] = [
  {
    id: "balances",
    title: "Balances",
    lead: "What is owed enters as a list of balances.",
    body: "A custodial app's customers, or an anchor's token holders. The list is the private input to everything that follows. No balance on it is ever published. Today Solva holds the list and passes it to its prover over a private connection.",
    figure: <BalancesFigure />,
    provenance: ["Example", "No balance published"],
    detail: <BalancesDetail />,
  },
  {
    id: "commit",
    title: "Commit",
    lead: "The list is folded into one commitment.",
    body: "The commitment stands for every balance on the list and for their total. Drop a balance or change one, and the commitment changes with it, so nothing can be left out or edited after the fact.",
    figure: <CommitFigure />,
    provenance: ["Example", "One commitment", "Total carried with it"],
    detail: <CommitDetail />,
  },
  {
    id: "proof",
    title: "Proof",
    lead: "A proof shows the total is covered.",
    body: "The proof takes the commitment and the reserve balance and shows that what is owed is at most what the reserve accounts hold. No balance is a public input, so none is published. It is small enough for a contract on Stellar to check in one call. The proof system's hiding mode is in development.",
    figure: <ProofFigure />,
    provenance: ["Example", "No balance published", "Totals public"],
    detail: <ProofDetail />,
  },
  {
    id: "verify",
    title: "Verify",
    lead: "A contract on Stellar checks the proof itself.",
    body: "The verifier contract runs the check on the network itself, so no server and no company has to be trusted with the answer. One verification on Testnet cost the fee shown here.",
    figure: <VerifyFigure />,
    provenance: [
      `Stellar ${verifierEvidence.network}`,
      `Ledger ${verifierEvidence.verifiedAtLedger.toLocaleString("en-US")}`,
      `${verifierEvidence.feeXlm} XLM`,
    ],
    detail: <VerifyDetail />,
  },
  {
    id: "record",
    title: "Record",
    lead: "The result is written once, for anyone to read.",
    body: "The verified totals are written once, with the ledger they were checked at. Holders, wallets, lending pools and auditors read them without asking anyone. Each new proof adds the next line, and nothing is edited after the fact. Covered, short and stale labels on each record are coming soon.",
    figure: <RecordFigure />,
    provenance: [
      "Example",
      `${latest.institution} · ${latest.asset}`,
      `Ledger ${latest.ledger.toLocaleString("en-US")}`,
    ],
    detail: <RecordDetail />,
  },
];

export function Steps() {
  const { active, register, isTracking } = useActiveStep(STEPS.length);
  const current = STEPS[active] ?? STEPS[0];

  return (
    <Chapter id="the-steps" index="01" labelledBy="steps-title">
      <ChapterHead
        id="steps-title"
        label="The five steps"
        title="From a list of balances to a public record."
        lead="The same five steps are designed to run every day for every asset; on Testnet today a cycle runs on request. The home page shows them in motion. This page walks through each one, with the evidence beside it."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-14">
        <aside
          aria-label="Where you are in the five steps"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="flex items-center gap-6 lg:flex-col lg:items-start">
            <SealInstrument
              mode="progress"
              step={active + 1}
              steps={STEPS.length}
              size="compact"
              className="w-24 shrink-0 lg:w-32"
            >
              <span className="font-display text-h3">{current.title}</span>
            </SealInstrument>
            <ol className="flex min-w-0 flex-1 flex-col border-t border-line lg:w-full">
              {STEPS.map((step, index) => {
                const on = index === active;
                return (
                  <li key={step.id} className="border-b border-line">
                    <a
                      href={`#step-${step.id}`}
                      aria-current={isTracking && on ? "step" : undefined}
                      className={cn(
                        "relative block py-2.5 pl-4 text-small transition-colors",
                        on ? "text-text" : "text-sec hover:text-text",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-2.5 bottom-2.5 left-0 w-0.5",
                          on ? "bg-signal" : "bg-transparent",
                        )}
                      />
                      {step.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <ol className="min-w-0">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              id={`step-${step.id}`}
              ref={register(index)}
              data-step={index}
              className="scroll-mt-24 border-t border-line py-12 first:border-t-0 first:pt-0 lg:py-16"
            >
              <h3 className="font-display text-h2">{step.title}</h3>
              <p className="mt-3 max-w-[40rem] text-lead text-sec">{step.lead}</p>
              <p className="mt-3 max-w-[40rem] text-body text-sec">{step.body}</p>
              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
                <figure className="min-w-0">
                  <div className="ruled-marks relative border border-line bg-bg p-4 sm:p-6">
                    {step.figure}
                  </div>
                  <figcaption className="mt-3">
                    <Provenance parts={step.provenance} />
                  </figcaption>
                </figure>
                <div className="min-w-0">{step.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Chapter>
  );
}
