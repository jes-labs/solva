"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@solva/ui";
import type { InclusionResult } from "@solva/shared-types";
import { Spinner } from "@/components/spinner";
import { checkInclusion, EXAMPLE_REFERENCE } from "@/lib/mock/inclusion";

type State = "idle" | "checking" | "done";

// Customer inclusion checker. Enter the reference your institution gave you, and
// the app calls verify_inclusion on-chain and answers yes or no. The result
// reveals only whether your reference is in the proof, never any balance.
export function InclusionClient() {
  const [reference, setReference] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<InclusionResult | null>(null);
  const [checkedRef, setCheckedRef] = useState("");

  async function check(rawRef: string) {
    const ref = rawRef.trim();
    if (!ref) return;
    setState("checking");
    setResult(null);
    setCheckedRef(ref);
    // Real path: solvaClient(tenant).verifyInclusion(ref).
    const next = await checkInclusion(ref);
    setResult(next);
    setState("done");
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-7">
      <header>
        <p className="eyebrow mb-3 text-acc-text">Customer check</p>
        <h1 className="font-display text-[clamp(28px,4vw,42px)] font-bold tracking-tight">
          Is your balance backed?
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-sec">
          Enter the reference your institution gave you. We check it against the latest proof on
          Stellar and answer yes or no, in seconds.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void check(reference);
        }}
        className="rounded-card border border-hair bg-surface p-6"
      >
        <label htmlFor="reference" className="eyebrow mb-2.5 block text-sec">
          Your reference
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. acct_8842"
            autoComplete="off"
            className="w-full flex-1 rounded-btn border border-hair bg-bg px-3.5 py-[13px] font-mono text-[15px] text-fg placeholder:text-sec focus:border-acc-text"
          />
          <Button
            type="submit"
            disabled={state === "checking" || !reference.trim()}
            className="sm:w-auto"
          >
            {state === "checking" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Checking
              </span>
            ) : (
              "Check inclusion"
            )}
          </Button>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[13px] text-sec">
          <span>Try:</span>
          <button
            type="button"
            onClick={() => {
              setReference(EXAMPLE_REFERENCE);
              void check(EXAMPLE_REFERENCE);
            }}
            className="rounded-pill border border-hair px-2.5 py-1 font-mono text-[12px] text-fg transition-colors hover:border-hair-strong"
          >
            {EXAMPLE_REFERENCE}
          </button>
        </div>
      </form>

      {state === "checking" && <CheckingCard />}
      {state === "done" && result && <Result result={result} reference={checkedRef} />}

      <p className="text-center text-[12.5px] leading-relaxed text-sec">
        This check reveals only whether your reference is in the proof. It never exposes your balance
        or anyone else&rsquo;s.
      </p>
    </div>
  );
}

function Result({ result, reference }: { result: InclusionResult; reference: string }) {
  if (result.included) {
    return (
      <section
        className="overflow-hidden rounded-card border bg-surface text-center"
        style={{ borderColor: "color-mix(in oklab, var(--acc) 40%, var(--hair))" }}
        aria-live="polite"
      >
        <div className="px-6 py-9">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-acc-deep text-acc-text">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-[22px] font-bold tracking-tight">
            Your balance is included
          </h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-relaxed text-sec">
            <span className="font-mono text-fg">{reference}</span> is committed in proof #
            {result.proofId}, verified on Stellar.
          </p>
        </div>
        <div className="border-t border-hair px-6 py-3.5 text-[13px]">
          <Link href="/verify" className="font-medium text-acc-text hover:underline">
            See the proof on the verify page →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-card border border-hair bg-surface px-6 py-9 text-center"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-hair text-amber">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h2 className="font-display text-[22px] font-bold tracking-tight">
        We couldn&rsquo;t find that reference
      </h2>
      <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-relaxed text-sec">
        Nothing matched <span className="font-mono text-fg">{reference}</span> in the latest proof.
        Double-check the reference, or contact your institution. A no can also mean the latest proof
        predates your account.
      </p>
    </section>
  );
}

function CheckingCard() {
  return (
    <section
      className="rounded-card border border-hair bg-surface px-6 py-9 text-center"
      aria-hidden="true"
    >
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-hair text-sec">
        <Spinner className="size-6" />
      </div>
      <div className="mx-auto h-5 w-48 animate-pulse rounded bg-panel" />
      <div className="mx-auto mt-2.5 h-4 w-64 animate-pulse rounded bg-panel" />
    </section>
  );
}
