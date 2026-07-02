"use client";

import { useEffect, useMemo, useState } from "react";

// A self-driving walkthrough of the Solva pipeline, end to end. Five top-level
// steps, each with sub-steps, each sub-step with the real operations underneath.
// It auto-plays and can be driven by hand, with a terminal-style stage and the
// explanation of what happens under the hood at every level.

interface Sub {
  id: string;
  title: string;
  detail: string;
  lines: string[];
}
interface Step {
  n: number;
  key: string;
  title: string;
  tag: string;
  subs: Sub[];
}

const STEPS: Step[] = [
  {
    n: 1,
    key: "attest",
    title: "Attest",
    tag: "The bank signs the reserves",
    subs: [
      {
        id: "authenticate",
        title: "Authenticate to the bank",
        detail:
          "Solva never holds bank credentials. The institution's orchestrator runs a standard OAuth handshake against the bank so it can read balances on the institution's behalf, with a short-lived token.",
        lines: [
          "GET  /oauth/authorize?client_id=solva   → code",
          "POST /oauth/token  (code)               → bearer (expires in 1h)",
        ],
      },
      {
        id: "read-balance",
        title: "Read the signed balance",
        detail:
          "For each account the bank returns the balance plus a signature over a canonical payload (account, balance, currency, timestamp), so the figure cannot be altered in transit or by Solva.",
        lines: [
          "GET /accounts/acct-anchor/balance",
          "→ 8,000,000 USD   as_of …   sig MEUCIQ…",
        ],
      },
      {
        id: "verify-signature",
        title: "Verify every signature",
        detail:
          "The orchestrator checks each signature against the bank's published ECDSA P-256 key. A bad signature aborts the cycle; a reserve is never silently dropped.",
        lines: [
          "verify(payload, sig, bank_pubkey)  → ✓",
          "any failure → the cycle aborts, no proof",
        ],
      },
    ],
  },
  {
    n: 2,
    key: "commit",
    title: "Commit",
    tag: "Build the Merkle Sum Tree",
    subs: [
      {
        id: "leaves",
        title: "Hash each customer into a leaf",
        detail:
          "Each customer becomes a leaf hashed with Poseidon2 over [id_hash, balance, 0, 0]. The leaf also carries the balance as its running sum.",
        lines: [
          "leaf.hash = poseidon2_hash4(id_hash, balance, 0, 0)",
          "leaf.sum  = balance",
        ],
      },
      {
        id: "nodes",
        title: "Bind the sums into every node",
        detail:
          "A parent hashes both children's hash and sum together. Binding the sums means no subtree can lie about its total without changing the root, which is what makes it a sum tree, not just a Merkle tree.",
        lines: [
          "node.hash = hash4(L.hash, L.sum, R.hash, R.sum)",
          "node.sum  = L.sum + R.sum",
        ],
      },
      {
        id: "root",
        title: "Commit to the root",
        detail:
          "The single root commits to the exact set of customers and to the total liabilities L at the same time. Change any balance and the root changes.",
        lines: ["root commits {customers} and Σ balances = L"],
      },
    ],
  },
  {
    n: 3,
    key: "prove",
    title: "Prove",
    tag: "Generate the zero-knowledge proof",
    subs: [
      {
        id: "witness",
        title: "Assemble the private witness",
        detail:
          "The witness holds every customer balance, the reserve figures, and last cycle's reserve total. None of it leaves the institution; only R, L and the root are public.",
        lines: [
          "private: balances[], reserves[], R_prev",
          "public:  R, L, root",
        ],
      },
      {
        id: "constraints",
        title: "Enforce the solvency constraints",
        detail:
          "The Noir circuit enforces the rules of a valid proof. If any constraint fails, no proof can exist, so a false statement is unprovable by construction.",
        lines: [
          "R ≥ L",
          "recomputed root == committed root,  root.sum == L",
          "Σ reserves == R",
          "fraud bound:  10·R ≤ 11·R_prev",
        ],
      },
      {
        id: "ultrahonk",
        title: "Generate the UltraHonk proof",
        detail:
          "Barretenberg produces an UltraHonk proof over BN254 with a keccak transcript. The proof reveals only R, L and the root, never a single customer balance.",
        lines: [
          "bb prove --scheme ultra_honk --oracle_hash keccak",
          "→ proof (14,592 bytes), nothing private revealed",
        ],
      },
    ],
  },
  {
    n: 4,
    key: "publish",
    title: "Publish",
    tag: "Land the proof on Stellar",
    subs: [
      {
        id: "invoke",
        title: "Build the Soroban call",
        detail:
          "The orchestrator encodes an invocation of publish_proof on the institution's own proof-registry contract, carrying the proof and its public inputs.",
        lines: ["publish_proof(proof, {R, L, root, R_prev})"],
      },
      {
        id: "owner-signs",
        title: "The owner signs",
        detail:
          "The registry is owner-gated. The institution's owner key signs the transaction, so only that institution can publish its own proofs.",
        lines: ["owner.require_auth()  → signed by the institution"],
      },
      {
        id: "verify-store",
        title: "Verify on-chain and store",
        detail:
          "The contract re-verifies the UltraHonk proof using Stellar's native BN254 host functions, re-asserts R ≥ L, and stores it under a fresh monotonic id. The proof is now a public fact.",
        lines: [
          "verify_ultrahonk(vk, proof, pub)  → ✓",
          "assert R ≥ L ;  store as proof #N",
        ],
      },
    ],
  },
  {
    n: 5,
    key: "verify",
    title: "Verify",
    tag: "Anyone checks, trust-minimized",
    subs: [
      {
        id: "public-read",
        title: "Public solvency read",
        detail:
          "Anyone reads get_latest_proof straight from the ledger: reserves, liabilities, timestamp. Solvency you do not have to take on faith.",
        lines: ["get_latest_proof()  → R, L, root, timestamp"],
      },
      {
        id: "inclusion",
        title: "Customer inclusion",
        detail:
          "A customer folds their leaf up the sibling path; the contract recomputes the root and matches it. They learn that their balance is counted, and nothing about anyone else.",
        lines: [
          "verify_inclusion(id_hash, balance, path)  → true",
          "reveals only the customer's own leaf",
        ],
      },
    ],
  },
];

interface Frame { stepIdx: number; subIdx: number }

const FRAME_MS = 4600;

export function PipelineExplainer() {
  const frames = useMemo<Frame[]>(
    () => STEPS.flatMap((s, stepIdx) => s.subs.map((_, subIdx) => ({ stepIdx, subIdx }))),
    [],
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [shown, setShown] = useState(true);

  const frame = frames[index]!;
  const step = STEPS[frame.stepIdx]!;
  const sub = step.subs[frame.subIdx]!;
  const atEnd = index >= frames.length - 1;

  // Auto-advance while playing; stop at the end.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      setIndex((i) => {
        if (i >= frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, FRAME_MS);
    return () => clearTimeout(id);
  }, [playing, index, frames.length]);

  // Fade each frame in. Respects prefers-reduced-motion via globals.css.
  useEffect(() => {
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [index]);

  const go = (i: number) => setIndex(Math.max(0, Math.min(frames.length - 1, i)));
  const jumpToStep = (stepIdx: number) => {
    const first = frames.findIndex((f) => f.stepIdx === stepIdx);
    if (first >= 0) setIndex(first);
  };

  return (
    <div className="overflow-hidden rounded-panel border border-hair bg-surface">
      <div className="grid lg:grid-cols-[300px_1fr]">
        {/* Rail: the nested step tracker. */}
        <div className="border-b border-hair p-5 lg:border-b-0 lg:border-r">
          <ol className="flex flex-col gap-1">
            {STEPS.map((s, i) => {
              const active = i === frame.stepIdx;
              const done = i < frame.stepIdx;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => jumpToStep(i)}
                    className="flex w-full items-center gap-3 rounded-btn px-2.5 py-2 text-left transition hover:bg-panel"
                  >
                    <RailDot n={s.n} active={active} done={done} />
                    <span className="min-w-0">
                      <span className={`block text-[14px] font-semibold ${active ? "text-fg" : "text-sec"}`}>
                        {s.title}
                      </span>
                      <span className="block truncate text-[12px] text-sec">{s.tag}</span>
                    </span>
                  </button>
                  {active && (
                    <ul className="ml-[26px] mt-1 flex flex-col gap-1.5 border-l border-hair pl-3.5">
                      {s.subs.map((sb, j) => (
                        <li key={sb.id}>
                          <button
                            type="button"
                            onClick={() => go(frames.findIndex((f) => f.stepIdx === i && f.subIdx === j))}
                            className={`flex items-center gap-2 text-left text-[12.5px] transition ${
                              j === frame.subIdx ? "text-acc-text" : "text-sec hover:text-fg"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                j === frame.subIdx ? "bg-acc" : "bg-hair-strong"
                              }`}
                            />
                            <span className="truncate">{sb.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Stage: the terminal + explanation for the active sub-step. */}
        <div className="flex min-h-[340px] flex-col p-6">
          <div className={`flex-1 transition-all duration-500 ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-acc-text">
              Step {step.n} · {step.title}
            </div>
            <h3 className="mt-2 font-display text-[22px] font-semibold tracking-tight text-fg">
              {sub.title}
            </h3>
            <p className="mt-2.5 max-w-[640px] text-[14.5px] leading-relaxed text-sec">{sub.detail}</p>

            <div className="mt-5 rounded-card border border-hair bg-bg">
              <div className="flex items-center gap-1.5 border-b border-hair px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-hair-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-hair-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-hair-strong" />
                <span className="ml-2 font-mono text-[11.5px] text-sec">solva · {step.key}</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words px-4 py-3.5 font-mono text-[12.5px] leading-relaxed">
                {sub.lines.map((l, k) => (
                  <div key={k} className="text-sec">
                    <span className="text-acc-text">›</span> {l}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* Controls + progress */}
          <div className="mt-6 flex items-center gap-3">
            <Ctrl label="Previous" onClick={() => go(index - 1)} disabled={index === 0}>‹</Ctrl>
            <button
              type="button"
              onClick={() => {
                if (atEnd) {
                  go(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-acc text-on-acc transition hover:-translate-y-px hover:shadow-cta"
              aria-label={atEnd ? "Replay" : playing ? "Pause" : "Play"}
            >
              {atEnd ? "↺" : playing ? "❚❚" : "▶"}
            </button>
            <Ctrl label="Next" onClick={() => go(index + 1)} disabled={atEnd}>›</Ctrl>

            <div className="ml-2 flex flex-1 items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-hair">
                <div
                  className="h-full rounded-full bg-acc transition-all duration-500"
                  style={{ width: `${((index + 1) / frames.length) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11.5px] tabular-nums text-sec">
                {index + 1}/{frames.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  const base = "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-semibold transition";
  if (done) return <span className={`${base} border-acc bg-acc text-on-acc`}>✓</span>;
  if (active) return <span className={`${base} border-acc text-acc-text`}>{n}</span>;
  return <span className={`${base} border-hair text-sec`}>{n}</span>;
}

function Ctrl({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-hair text-fg transition hover:border-hair-strong disabled:opacity-40"
    >
      {children}
    </button>
  );
}
