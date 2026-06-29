"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

// Two demo institutions. Each has its own tenant and its own on-chain registry,
// so the playground shows multi-tenancy: a proof for one never touches the
// other. The backend must have these tenants seeded (the e2e seed and
// `just provision-tenant`).
const INSTITUTIONS = [
  { name: "Meridian Bank", kind: "Bank", tenantId: "11111111-1111-1111-1111-111111111111" },
  { name: "Solstice Exchange", kind: "Exchange", tenantId: "22222222-2222-2222-2222-222222222222" },
] as const;

// Scenarios mirror the mock bank. Liabilities are fixed; only reserves move,
// which is what changes the outcome.
const LIABILITIES = "9,000,000";
const SCENARIOS = [
  { id: "solvent", label: "Solvent", reserves: "16,000,000", note: "Reserves comfortably cover liabilities." },
  { id: "near-breach", label: "Near breach", reserves: "9,500,000", note: "Reserves only just cover liabilities." },
  { id: "insolvent", label: "Insolvent", reserves: "4,500,000", note: "Reserves below liabilities. Must be rejected." },
] as const;

const STAGES = [
  { key: "connect", label: "Connect bank", desc: "OAuth into the mock open-banking sandbox." },
  { key: "reserves", label: "Fetch reserves", desc: "An ECDSA-signed balance from the bank." },
  { key: "prove", label: "Generate proof", desc: "UltraHonk proof that R ≥ L, no balances revealed." },
  { key: "publish", label: "Publish on-chain", desc: "Owner-signed publish to the institution's registry." },
  { key: "verify", label: "Verify", desc: "Anyone confirms it against Stellar." },
] as const;

const EXPLORER =
  process.env.NEXT_PUBLIC_STELLAR_EXPLORER ?? "https://stellar.expert/explorer/testnet";

type StageState = "idle" | "active" | "done" | "failed";
type Institution = (typeof INSTITUTIONS)[number];
type Scenario = (typeof SCENARIOS)[number];

interface ProofDTO {
  id?: string;
  chain_proof_id?: number;
  root_hash?: string;
  reserves_total?: string;
  liabilities_total?: string;
}
interface ContractDTO {
  contract_id?: string;
  network?: string;
}

export function SandboxClient() {
  const [institution, setInstitution] = useState<Institution>(INSTITUTIONS[0]!);
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]!);
  const [stages, setStages] = useState<Record<string, StageState>>({});
  const [running, setRunning] = useState(false);
  const [proof, setProof] = useState<ProofDTO | null>(null);
  const [contract, setContract] = useState<ContractDTO | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "reject">("info");

  // Load the institution's current contract and latest proof so the panel shows
  // real state before any run.
  const loadStatus = useCallback(async (tenantId: string) => {
    try {
      const res = await fetch(`/api/sandbox/status?tenant=${encodeURIComponent(tenantId)}`);
      const data = await res.json();
      setContract(data.contract ?? null);
      setProof(data.proof ?? null);
    } catch {
      setContract(null);
      setProof(null);
    }
  }, []);

  useEffect(() => {
    setStages({});
    setMessage(null);
    void loadStatus(institution.tenantId);
  }, [institution, loadStatus]);

  async function run() {
    setRunning(true);
    setMessage(null);
    setProof(null);

    // Pace the stages for legibility while the real cycle runs server-side. The
    // outcome below is real; this only animates the steps.
    const order = STAGES.map((s) => s.key);
    setStages(Object.fromEntries(order.map((k) => [k, "idle"])));
    let step = 0;
    const tick = setInterval(() => {
      if (step < order.length) {
        setStages((prev) => ({ ...prev, [order[step]!]: "active" }));
        if (step > 0) setStages((prev) => ({ ...prev, [order[step - 1]!]: "done" }));
        step += 1;
      }
    }, 700);

    try {
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId: institution.tenantId, scenario: scenario.id }),
      });
      const data = await res.json();
      clearInterval(tick);

      if (data.published) {
        setStages(Object.fromEntries(order.map((k) => [k, "done"])));
        await loadStatus(institution.tenantId);
      } else if (data.rejected) {
        // The honest outcome for insolvent: no proof could be generated.
        setStages({ connect: "done", reserves: "done", prove: "failed", publish: "idle", verify: "idle" });
        setTone("reject");
        setMessage("Proof rejected: reserves are below liabilities. Solva will not prove a lie.");
      } else {
        setStages({});
        setTone("info");
        setMessage(data.error ?? "The backend is unreachable. Start the Solva stack and try again.");
      }
    } catch (err) {
      clearInterval(tick);
      setStages({});
      setTone("info");
      setMessage(`The backend is unreachable: ${String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  const explorerUrl = contract?.contract_id ? `${EXPLORER}/contract/${contract.contract_id}` : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Institution picker: the multi-tenancy frame. */}
      <div>
        <div className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-sec">
          Institution
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTITUTIONS.map((inst) => {
            const selected = inst.tenantId === institution.tenantId;
            return (
              <button
                key={inst.tenantId}
                type="button"
                onClick={() => setInstitution(inst)}
                disabled={running}
                aria-pressed={selected}
                className={`rounded-card border px-5 py-4 text-left transition disabled:opacity-60 ${
                  selected ? "border-acc" : "border-hair hover:border-hair-strong"
                }`}
              >
                <div className="font-display text-[17px] font-semibold text-fg">{inst.name}</div>
                <div className="mt-0.5 text-[13.5px] text-sec">
                  {inst.kind} &middot; its own contract
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-2">
        {/* Left: pick a scenario and run. */}
        <Card className="flex flex-col gap-5 p-7">
          <div>
            <div className="font-mono text-[13px] text-acc-text">01</div>
            <h2 className="mt-1 font-display text-[19px] font-semibold text-fg">Choose a scenario</h2>
            <p className="mt-1.5 text-[14.5px] leading-snug text-sec">
              Liabilities are fixed at {LIABILITIES}. Only the bank&apos;s reserves change.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {SCENARIOS.map((s) => {
              const selected = s.id === scenario.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s)}
                  disabled={running}
                  aria-pressed={selected}
                  className={`rounded-btn border px-4 py-3 text-left transition disabled:opacity-60 ${
                    selected ? "border-acc" : "border-hair hover:border-hair-strong"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold text-fg">{s.label}</span>
                    <span className="font-mono text-[13px] tabular-nums text-sec">R = {s.reserves}</span>
                  </div>
                  <div className="mt-0.5 text-[13.5px] text-sec">{s.note}</div>
                </button>
              );
            })}
          </div>

          <Button onClick={run} disabled={running} className="w-full">
            {running ? "Running the cycle…" : `Run the cycle for ${institution.name}`}
          </Button>

          {message && (
            <div
              className={`rounded-btn border px-4 py-3 text-[14px] leading-snug ${
                tone === "reject" ? "border-red text-fg" : "border-hair text-sec"
              }`}
              role="status"
            >
              {message}
            </div>
          )}
        </Card>

        {/* Right: the live stages and the on-chain result. */}
        <Card className="flex flex-col gap-5 p-7">
          <div>
            <div className="font-mono text-[13px] text-acc-text">02</div>
            <h2 className="mt-1 font-display text-[19px] font-semibold text-fg">
              The proof lands on Stellar
            </h2>
          </div>

          <ol className="flex flex-col">
            {STAGES.map((stage, i) => {
              const state = stages[stage.key] ?? "idle";
              return (
                <li key={stage.key} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <StageDot state={state} />
                    {i < STAGES.length - 1 && (
                      <span
                        className={`w-px flex-1 ${state === "done" ? "bg-acc" : "bg-hair"}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={`pb-4 ${i === STAGES.length - 1 ? "pb-0" : ""}`}>
                    <div className="text-[15px] font-medium text-fg">{stage.label}</div>
                    <div className="mt-0.5 text-[13.5px] leading-snug text-sec">{stage.desc}</div>
                  </div>
                </li>
              );
            })}
          </ol>

          {proof && (
            <div className="rounded-btn border border-hair p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Reserves (R)" value={proof.reserves_total} />
                <Field label="Liabilities (L)" value={proof.liabilities_total} />
                <Field
                  label="On-chain proof"
                  value={proof.chain_proof_id != null ? `#${proof.chain_proof_id}` : "—"}
                />
                <Field label="Contract" value={short(contract?.contract_id)} />
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3.5 inline-block text-[14px] font-semibold text-acc-text transition hover:opacity-80"
                >
                  View {institution.name}&apos;s contract on Stellar &rarr;
                </a>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StageDot({ state }: { state: StageState }) {
  const cls =
    state === "done"
      ? "bg-acc border-acc"
      : state === "active"
        ? "border-acc bg-acc animate-pulse"
        : state === "failed"
          ? "bg-red border-red"
          : "border-hair-strong bg-transparent";
  return <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border ${cls}`} aria-hidden="true" />;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-sec">{label}</div>
      <div className="mt-1 font-display text-[15px] tabular-nums text-fg">{value ?? "—"}</div>
    </div>
  );
}

function short(id?: string): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}
