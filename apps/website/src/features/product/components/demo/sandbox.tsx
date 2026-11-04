"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ChapterHead, Provenance } from "@/components/ui/ledger";
import { SealInstrument } from "@/components/ui/seal-instrument";
import { explorer } from "@/config/evidence";
import { cn } from "@/lib/utils";
import { useSandbox } from "../../hooks/use-sandbox";
import {
  INSTITUTIONS,
  SCENARIOS,
  STEPS,
  completedSteps,
  type LogKind,
  type StepStatus,
} from "../../lib/sandbox";

const LOG_CLASS: Record<LogKind, string> = {
  ok: "text-covered",
  warn: "text-short",
  data: "text-text",
  info: "text-sec",
};

const LOG_PREFIX: Record<LogKind, string> = { ok: "✓ ", warn: "✗ ", data: "  ", info: "  " };

function Marker({ n, status }: { n: number; status: StepStatus }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center border font-mono text-small num",
        status === "done" && "border-covered bg-covered-tint text-covered",
        status === "failed" && "border-short bg-short-tint text-short",
        status === "running" && "animate-pulse border-signal text-text",
        status === "ready" && "border-text text-text",
        status === "locked" && "border-line text-faint",
      )}
    >
      {status === "done" ? "✓" : status === "failed" ? "!" : n}
    </span>
  );
}

export function Sandbox() {
  const sandbox = useSandbox();
  const done = completedSteps(sandbox.status);
  const contractUrl = sandbox.contract?.contract_id
    ? explorer.contract(sandbox.contract.contract_id)
    : null;

  return (
    <section id="run" aria-labelledby="run-title" className="chapter relative border-t border-line">
      <span aria-hidden="true" className="chapter-index">
        01
      </span>
      <div className="px-5 py-[clamp(4.5rem,9vw,8.5rem)] sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_16rem] lg:items-end">
          <ChapterHead
            id="run-title"
            label="Run it"
            title="Six steps, all of them real."
            lead="Pick an institution, then run the steps one at a time. Kestrel and Solstice use a stand-in custodian run by Solva, with three scenarios. Harbor Wallet's reserves are real Testnet USDC, read from Stellar on every run. Every published proof lands on Stellar Testnet, where you can open it."
          />
          <SealInstrument
            mode="progress"
            step={done}
            steps={STEPS.length}
            className="mx-auto w-40 lg:w-full"
          >
            <span className="seal-value font-display num">
              {done}/{STEPS.length}
            </span>
            <span className="mt-1.5 text-small text-sec">steps done</span>
          </SealInstrument>
        </div>

        {sandbox.reachable === false ? (
          <p className="mt-10 border border-short/40 bg-short-tint px-5 py-4 text-body text-text">
            The sandbox is not reachable from this page right now, so the steps below cannot run.
            Nothing is simulated in its place.
          </p>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-14">
          <div className="flex flex-col gap-8">
            <fieldset>
              <legend className="text-small font-medium text-sec">Institution</legend>
              <div className="mt-3 border-t border-line">
                {INSTITUTIONS.map((item) => {
                  const selected = item.tenantId === sandbox.institution.tenantId;
                  return (
                    <label
                      key={item.tenantId}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-1 border-b border-line py-4 pl-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                        selected ? "text-text" : "text-sec hover:text-text",
                        sandbox.busy && "opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        name="institution"
                        className="sr-only"
                        checked={selected}
                        disabled={sandbox.busy}
                        onChange={() => sandbox.setInstitution(item)}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-4 bottom-4 left-0 w-0.5",
                          selected ? "bg-signal" : "bg-transparent",
                        )}
                      />
                      <span className="font-display text-h3">
                        {item.name} <span className="text-sec">· {item.kind}</span>
                      </span>
                      <span className="text-small">{item.owes}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {sandbox.institution.reserves.kind === "onchain" ? (
              <div className="border-t border-line pt-4">
                <p className="text-small font-medium text-sec">Reserves</p>
                <p className="mt-3 text-body text-text">
                  Read from Stellar Testnet on every run: the {sandbox.institution.reserves.code}{" "}
                  balance of account{" "}
                  <a
                    href={explorer.account(sandbox.institution.reserves.account)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-small break-all underline decoration-link-line underline-offset-4 hover:decoration-text"
                  >
                    {sandbox.institution.reserves.account}
                  </a>
                  . No scenario applies: the proof uses whatever the account holds.
                </p>
              </div>
            ) : (
              <fieldset>
                <legend className="text-small font-medium text-sec">Scenario</legend>
                <div className="mt-3 border-t border-line">
                  {SCENARIOS.map((item) => {
                    const selected = item.id === sandbox.scenario.id;
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-1 border-b border-line py-4 pl-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                          selected ? "text-text" : "text-sec hover:text-text",
                          sandbox.busy && "opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          name="scenario"
                          className="sr-only"
                          checked={selected}
                          disabled={sandbox.busy}
                          onChange={() => sandbox.setScenario(item)}
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-4 bottom-4 left-0 w-0.5",
                            selected ? "bg-signal" : "bg-transparent",
                          )}
                        />
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-h3">{item.label}</span>
                          <span className="font-mono text-small num">R = {item.reserves}</span>
                        </span>
                        <span className="text-small">{item.note}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <button
              type="button"
              onClick={() => sandbox.reset()}
              disabled={sandbox.busy}
              className="self-start text-small font-medium underline decoration-line-strong underline-offset-4 hover:decoration-text disabled:opacity-50"
            >
              Restart the run
            </button>
          </div>

          <ol className="ruled-marks relative border border-line bg-bg">
            {STEPS.map((step, index) => {
              const status = sandbox.status[step.id];
              const lines = sandbox.logs[step.id];
              const proofUrl =
                step.id === "prove" && sandbox.proof?.chain_proof_id != null && contractUrl
                  ? contractUrl
                  : null;
              return (
                <li key={step.id} className="border-b border-line last:border-b-0">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <Marker n={index + 1} status={status} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-h3">{step.title}</p>
                      <p className="text-small text-sec">{step.summary}</p>
                    </div>
                    {status === "ready" ? (
                      <Button
                        size="sm"
                        onClick={() => void sandbox.run(step.id)}
                        disabled={sandbox.busy}
                      >
                        {step.id === "prove" ? "Prove and publish" : "Run"}
                      </Button>
                    ) : null}
                    {status === "running" ? (
                      <span className="font-mono text-small text-sec">running…</span>
                    ) : null}
                  </div>
                  {lines.length > 0 ? (
                    <div className="border-t border-line bg-raised px-5 py-4">
                      <pre className="overflow-x-auto font-mono text-small leading-relaxed whitespace-pre-wrap break-words">
                        {lines.map((line, i) => (
                          <div key={i} className={LOG_CLASS[line.kind]}>
                            {LOG_PREFIX[line.kind]}
                            {line.text}
                          </div>
                        ))}
                      </pre>
                      {step.id === "registry" && contractUrl ? (
                        <a
                          href={contractUrl}
                          className="mt-3 inline-flex items-center gap-1 text-small font-medium underline decoration-line-strong underline-offset-4 hover:decoration-text"
                        >
                          Open the contract on Stellar
                          <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : null}
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          className="mt-3 inline-flex items-center gap-1 text-small font-medium underline decoration-line-strong underline-offset-4 hover:decoration-text"
                        >
                          Open proof #{sandbox.proof?.chain_proof_id} on Stellar
                          <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <Provenance
          parts={[
            "Stellar Testnet",
            sandbox.institution.reserves.kind === "onchain"
              ? "Reserve source: Testnet USDC read from Stellar"
              : "Reserve source: Solva's sandbox, signed balances",
            "Example customer balances",
          ]}
          className="mt-8"
        />
      </div>
    </section>
  );
}
