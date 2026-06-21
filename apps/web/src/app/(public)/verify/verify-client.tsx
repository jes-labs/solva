"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, StatusPill } from "@solva/ui";
import type { Proof } from "@solva/shared-types";
import { CopyButton } from "@/components/copy-button";
import { Spinner } from "@/components/spinner";
import { verifyProofClientSide } from "@/lib/noir";
import { EXAMPLE_PROOF_IDS, lookupProof } from "@/lib/mock/proofs";
import {
  formatAmount,
  formatBpsPercent,
  formatRelativeTime,
  formatTimestamp,
  marginBps,
  truncateMiddle,
} from "@/lib/format";

type LookupState = "idle" | "loading" | "found" | "notfound";
type ClientCheck = { state: "idle" | "running" | "done"; verified?: boolean; message?: string };

// Public verify surface. Anyone pastes a proof id, reads the published totals and
// the on-chain verified state, and can re-check the proof in their own browser.
export function VerifyClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LookupState>("idle");
  const [proof, setProof] = useState<Proof | null>(null);
  const [missedId, setMissedId] = useState("");
  const [check, setCheck] = useState<ClientCheck>({ state: "idle" });

  const lookUp = useCallback(async (rawId: string) => {
    const id = rawId.trim();
    if (!id) return;
    setState("loading");
    setProof(null);
    setCheck({ state: "idle" });
    const result = await lookupProof(id);
    if (result) {
      setProof(result);
      setState("found");
    } else {
      setMissedId(id);
      setState("notfound");
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setQuery(id);
      void lookUp(id);
    }
  }, [searchParams, lookUp]);

  async function runClientCheck() {
    if (!proof) return;
    setCheck({ state: "running" });
    const result = await verifyProofClientSide(proof);
    setCheck({
      state: "done",
      verified: result.verified,
      message: result.verified
        ? "The proof verified in your browser. You did not trust any server."
        : (result.unavailableReason ?? "Verification could not run."),
    });
  }

  return (
    <>
      {/* Lookup */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookUp(query);
        }}
        className="mx-auto mt-10 max-w-[600px]"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            aria-label="Proof id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a proof id, e.g. 1042"
            inputMode="numeric"
            autoComplete="off"
            className="w-full flex-1 rounded-btn border border-hair bg-surface px-4 py-[15px] font-mono text-[15px] text-fg placeholder:text-sec focus:border-acc-text"
          />
          <Button
            type="submit"
            size="lg"
            disabled={state === "loading" || !query.trim()}
            className="sm:w-auto"
          >
            {state === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Verifying
              </span>
            ) : (
              "Verify proof"
            )}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px] text-sec">
          <span>Try a sample:</span>
          {EXAMPLE_PROOF_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setQuery(id);
                void lookUp(id);
              }}
              className="rounded-pill border border-hair px-2.5 py-1 font-mono text-[12px] text-fg transition-colors hover:border-hair-strong"
            >
              {id}
            </button>
          ))}
        </div>
      </form>

      {/* Result area */}
      <div className="mx-auto mt-10 max-w-[760px]">
        {state === "idle" && <TrustPoints />}
        {state === "loading" && <ResultSkeleton />}
        {state === "notfound" && <NotFound id={missedId} />}
        {state === "found" && proof && (
          <ProofResult proof={proof} check={check} onClientCheck={runClientCheck} />
        )}
      </div>
    </>
  );
}

function ProofResult({
  proof,
  check,
  onClientCheck,
}: {
  proof: Proof;
  check: ClientCheck;
  onClientCheck: () => void;
}) {
  const { reservesTotal, liabilitiesTotal, rootHash } = proof.publicInputs;
  const bps = marginBps(reservesTotal, liabilitiesTotal);
  const coverage = coveragePercent(reservesTotal, liabilitiesTotal);

  return (
    <section
      className="overflow-hidden rounded-panel border bg-surface"
      style={{ borderColor: "color-mix(in oklab, var(--acc) 40%, var(--hair))" }}
      aria-live="polite"
    >
      {/* Verdict band */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <StatusPill tone="solvent" label="Solvent" />
          <span className="font-mono text-[12.5px] text-sec">Proof #{proof.id}</span>
        </div>
        <div className="inline-flex items-center gap-2 text-[13px] font-medium text-acc-text">
          <CheckIcon />
          Verified on Stellar · {formatRelativeTime(proof.publishedAt)}
        </div>
      </div>

      {/* Totals */}
      <div className="px-6 py-8 sm:px-8">
        <div className="grid grid-cols-1 divide-y divide-hair sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Figure label="Reserves (R)" value={formatAmount(reservesTotal)} accent />
          <Figure
            label="Liabilities (L)"
            value={formatAmount(liabilitiesTotal)}
            className="pt-5 sm:pl-8 sm:pt-0"
          />
        </div>

        {/* Coverage */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between font-mono text-[12px]">
            <span className="text-sec">Liabilities {coverage}% of reserves</span>
            <span className="text-acc-text">
              +{formatBpsPercent(bps)} margin ({bps} bps)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-acc" style={{ width: `${coverage}%` }} />
          </div>
          <p className="mt-2.5 text-[13px] text-sec">
            Reserves cover every liability committed in this proof, with headroom to spare.
          </p>
        </div>
      </div>

      {/* Metadata */}
      <dl className="grid gap-x-8 gap-y-5 border-t border-hair px-6 py-6 sm:grid-cols-2 sm:px-8">
        <Meta label="Published">
          <span className="text-fg">{formatTimestamp(proof.publishedAt)}</span>
        </Meta>
        <Meta label="Proof id">
          <span className="font-mono text-fg">{proof.id}</span>
          <CopyButton value={proof.id} label="Copy proof id" />
        </Meta>
        <Meta label="Sum-tree root">
          <span className="font-mono text-fg">{truncateMiddle(rootHash)}</span>
          <CopyButton value={rootHash} label="Copy root hash" />
        </Meta>
        <Meta label="Proof bytes">
          <span className="font-mono text-fg">{truncateMiddle(proof.proof, 8, 6)}</span>
          <CopyButton value={proof.proof} label="Copy proof bytes" />
        </Meta>
      </dl>

      {/* Client-side verification */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair bg-bg px-6 py-5 sm:px-8">
        <div className="max-w-[420px]">
          <h2 className="text-[14.5px] font-semibold text-fg">Verify in your browser</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-sec">
            Re-check the proof locally with noir, trusting no one.
          </p>
        </div>
        <Button variant="outline" onClick={onClientCheck} disabled={check.state === "running"}>
          {check.state === "running" ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Checking
            </span>
          ) : (
            "Verify locally"
          )}
        </Button>
      </div>
      {check.state === "done" && (
        <p
          className={`px-6 pb-5 text-[13px] sm:px-8 ${check.verified ? "text-acc-text" : "text-sec"}`}
          role="status"
        >
          {check.message}
        </p>
      )}
    </section>
  );
}

function Figure({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="eyebrow text-sec">{label}</div>
      <div
        className={`mt-2.5 font-display text-[clamp(26px,5vw,38px)] font-bold tabular-nums tracking-tight ${
          accent ? "text-acc-text" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow mb-1.5 text-sec">{label}</dt>
      <dd className="flex items-center gap-2.5 text-[13.5px]">{children}</dd>
    </div>
  );
}

function TrustPoints() {
  const points = [
    { title: "Read on-chain", body: "Totals come straight from the Stellar contract, not from us." },
    { title: "Reveals nothing", body: "A proof shows reserves ≥ liabilities and no individual balance." },
    { title: "Re-check yourself", body: "Verify the proof in your own browser, trusting no server." },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {points.map((point) => (
        <div key={point.title} className="rounded-card border border-hair bg-surface p-5">
          <div className="mb-3 grid size-8 place-items-center rounded-btn bg-panel text-acc-text">
            <CheckIcon />
          </div>
          <h2 className="text-[14.5px] font-semibold text-fg">{point.title}</h2>
          <p className="mt-1 text-[13px] leading-snug text-sec">{point.body}</p>
        </div>
      ))}
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <section className="rounded-panel border border-hair bg-surface px-6 py-12 text-center" aria-live="polite">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-hair text-sec">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="font-display text-[20px] font-semibold tracking-tight">No proof found</h2>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[14px] leading-snug text-sec">
        Nothing published under <span className="font-mono text-fg">{id}</span>. Check the id and try
        again.
      </p>
    </section>
  );
}

function ResultSkeleton() {
  return (
    <section className="overflow-hidden rounded-panel border border-hair bg-surface" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-hair px-6 py-5 sm:px-8">
        <div className="h-6 w-28 animate-pulse rounded-pill bg-panel" />
        <div className="h-4 w-44 animate-pulse rounded bg-panel" />
      </div>
      <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 sm:px-8">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="h-3 w-24 animate-pulse rounded bg-panel" />
            <div className="mt-3 h-9 w-40 animate-pulse rounded bg-panel" />
          </div>
        ))}
      </div>
      <div className="border-t border-hair px-6 py-6 sm:px-8">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-panel" />
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Liabilities as a percentage of reserves, clamped to 100.
function coveragePercent(reserves: string, liabilities: string): number {
  try {
    const r = BigInt(reserves);
    const l = BigInt(liabilities);
    if (r <= 0n) return 0;
    return Math.min(100, Math.round(Number((l * 1000n) / r) / 10));
  } catch {
    return 0;
  }
}
