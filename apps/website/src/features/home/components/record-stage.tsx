"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useRecordStage } from "../hooks/use-record-stage";
import { StageFigure } from "./stage-figure";

const STEPS = [
  {
    title: "Balances",
    body: "What is owed enters as a list of balances: a custodial app's customers, or an anchor's token holders. No balance on the list is ever published.",
  },
  {
    title: "Commit",
    body: "The list is folded into one commitment that also carries its total. Drop a balance or change one afterwards, and the commitment changes with it.",
  },
  {
    title: "Proof",
    body: "A proof shows that the total behind the commitment is at most the reserve balance, signed by a custodian or read from Stellar. No balance is a public input, so none is published.",
  },
  {
    title: "Verify",
    body: "A contract on Stellar checks the proof itself, so no server and no company has to be trusted with the answer. One check costs about 0.012 XLM.",
  },
  {
    title: "Record",
    body: "The verified totals are written once, with the ledger they were checked at. Anyone can read them, and nobody can edit them. Covered, short and stale labels on each record are coming soon.",
  },
] as const;

export function RecordStage() {
  const scope = useRef<HTMLElement>(null);
  const { step, goTo, pinned } = useRecordStage(scope, STEPS.length);

  return (
    <section
      ref={scope}
      id="how-a-record-is-made"
      aria-labelledby="stage-title"
      className={cn("chapter relative border-t border-line", pinned && "lg:h-[260vh]")}
    >
      <span aria-hidden="true" className="chapter-index">
        02
      </span>
      <div
        className={cn(
          "px-5 py-[clamp(4.5rem,9vw,8.5rem)] sm:px-8 lg:px-12",
          pinned && "lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:py-0",
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tick-lead font-sans text-small font-medium text-sec">
              How a record is made
            </p>
            <h2 id="stage-title" className="mt-5 max-w-[16ch] font-display text-h1">
              Five steps to a daily record.
            </h2>
          </div>
          <p className="max-w-md text-body text-sec">
            The same five steps are designed to run every day for every asset. On Testnet today a
            cycle runs on request. Scroll through them, or pick a step.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
          <ol data-rows className="flex flex-col border-t border-line">
            {STEPS.map((item, index) => {
              const n = index + 1;
              const active = step === n;
              return (
                <li key={item.title} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "relative flex w-full flex-col gap-2 py-4 pl-6 text-left transition-colors",
                      active ? "text-text" : "text-sec hover:text-text",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-4 bottom-4 left-0 w-0.5 transition-colors",
                        active ? "bg-signal" : "bg-transparent",
                      )}
                    />
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-micro tracking-[0.08em] text-faint num">
                        {String(n).padStart(2, "0")}
                      </span>
                      <span className="font-display text-h3">{item.title}</span>
                    </span>
                    <span
                      className={cn(
                        "text-body transition-[max-height,opacity] duration-300",
                        active
                          ? "max-h-40 opacity-100"
                          : "max-h-0 overflow-hidden opacity-0 lg:max-h-0",
                      )}
                    >
                      {item.body}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ruled-marks relative border border-line bg-bg p-4 sm:p-8">
            <StageFigure step={step} scrub={pinned} />
            <p className="mt-4 text-small text-sec">
              Step {step} of {STEPS.length} · {STEPS[step - 1]?.title}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
