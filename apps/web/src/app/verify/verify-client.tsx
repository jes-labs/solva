"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, StatusPill } from "@solva/ui";
import type { Proof } from "@solva/shared-types";
import { CopyButton } from "@/components/copy-button";
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

// Public verify surface. Anyone pastes a proof id, the app reads the published
// totals and the on-chain verified state, and can optionally re-check the proof
// in their own browser. No wallet, no account.
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
    // Real path: solvaClient(tenant).getProof(id), catching not-found as null.
    const result = await lookupProof(id);
    if (result) {
      setProof(result);
      setState("found");
    } else {
      setMissedId(id);
      setState("notfound");
    }
  }, []);

  // Deep link: /verify?id=1042 fills the field and looks it up on load, so the
  // dashboard and inclusion pages can link straight to a verified proof.
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
        ? "The proof verified in your browser. You did not have to trust any server."
        : (result.unavailableReason ?? "Verification could not run."),
    });
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-8">
      <header>
        <p className="eyebrow mb-3 text-acc-text">Public verification</p>
        <h1 className="font-display text-[clamp(28px,4vw,42px)] font-bold tracking-tight">
          Verify a proof.
        </h1>
        <p className="mt-3 max-w-[560px] text-[15.5px] leading-relaxed text-sec">
          Paste a proof id to read the totals it published and confirm it was verified on Stellar.
          Anyone can check a proof; no wallet or account is needed.
        </p>
      </header>

      {/* Lookup */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookUp(query);
        }}
        className="rounded-card border border-hair bg-surface p-6"
      >
        <label htmlFor="proof-id" className="eyebrow mb-2.5 block text-sec">
          Proof id
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id="proof-id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 1042"
            inputMode="numeric"
            autoComplete="off"
            className="w-full flex-1 rounded-btn border border-hair bg-bg px-3.5 py-[13px] font-mono text-[15px] text-fg placeholder:text-sec focus:border-acc-text"
          />
          <Button type="submit" disabled={state === "loading" || !query.trim()} className="sm:w-auto">
            {state === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Verifying
              </span>
            ) : (
              "Verify proof"
            )}
          </Button>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[13px] text-sec">
          <span>Try:</span>
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

      {state === "loading" && <ResultSkeleton />}
      {state === "notfound" && <NotFound id={missedId} />}
      {state === "found" && proof && (
        <ProofResult proof={proof} check={check} onClientCheck={runClientCheck} />
      )}
    </div>
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

  return (
    <section className="overflow-hidden rounded-card border border-hair bg-surface" aria-live="polite">
      {/* Verdict bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-6 py-4">
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
      <div className="grid gap-px bg-hair sm:grid-cols-2">
        <Figure label="Reserves (R)" value={formatAmount(reservesTotal)} />
        <Figure label="Liabilities (L)" value={formatAmount(liabilitiesTotal)} />
      </div>

      {/* Margin */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hair px-6 py-4 text-sm">
        <span className="text-sec">Reserves cover liabilities</span>
        <span className="font-mono text-acc-text">
          R ≥ L · +{formatBpsPercent(bps)} ({bps} bps) margin
        </span>
      </div>

      {/* Metadata */}
      <dl className="grid gap-x-8 gap-y-4 border-t border-hair px-6 py-5 sm:grid-cols-2">
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
      <div className="border-t border-hair px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-[420px]">
            <h2 className="text-[15px] font-semibold text-fg">Verify in your browser</h2>
            <p className="mt-1 text-[13.5px] leading-snug text-sec">
              Re-check the proof locally with noir, without trusting Solva or any server.
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
            className={`mt-3 text-[13.5px] ${check.verified ? "text-acc-text" : "text-sec"}`}
            role="status"
          >
            {check.message}
          </p>
        )}
      </div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-6 py-5">
      <div className="eyebrow text-sec">{label}</div>
      <div className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-bold tabular-nums tracking-tight">
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

function NotFound({ id }: { id: string }) {
  return (
    <section
      className="rounded-card border border-hair bg-surface px-6 py-10 text-center"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-hair text-sec">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="font-display text-[19px] font-semibold tracking-tight">No proof found</h2>
      <p className="mx-auto mt-1.5 max-w-[360px] text-[14px] leading-snug text-sec">
        Nothing published under <span className="font-mono text-fg">{id}</span>. Check the id and try
        again.
      </p>
    </section>
  );
}

function ResultSkeleton() {
  return (
    <section className="overflow-hidden rounded-card border border-hair bg-surface" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-hair px-6 py-4">
        <div className="h-6 w-28 animate-pulse rounded-pill bg-panel" />
        <div className="h-4 w-40 animate-pulse rounded bg-panel" />
      </div>
      <div className="grid gap-px bg-hair sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-surface px-6 py-5">
            <div className="h-3 w-24 animate-pulse rounded bg-panel" />
            <div className="mt-3 h-8 w-36 animate-pulse rounded bg-panel" />
          </div>
        ))}
      </div>
      <div className="border-t border-hair px-6 py-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-panel" />
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
