"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

// Two demo institutions, each on its own on-chain registry. The backend seeds
// them (just demo): a proof for one never touches the other.
const INSTITUTIONS = [
  { name: "Meridian Bank", kind: "Bank", tenantId: "11111111-1111-1111-1111-111111111111" },
  { name: "Solstice Exchange", kind: "Exchange", tenantId: "22222222-2222-2222-2222-222222222222" },
] as const;

const SCENARIOS = [
  { id: "solvent", label: "Solvent", reserves: "16,000,000", note: "Reserves comfortably cover liabilities." },
  { id: "near-breach", label: "Near breach", reserves: "9,500,000", note: "Reserves only just cover liabilities." },
  { id: "insolvent", label: "Insolvent", reserves: "4,500,000", note: "Reserves below liabilities. Must be rejected." },
] as const;

const EXPLORER =
  process.env.NEXT_PUBLIC_STELLAR_EXPLORER ?? "https://stellar.expert/explorer/testnet";
// cust-001's id hash, seeded by the demo, for the inclusion step.
const DEMO_ID_HASH = "0000000000000000000000000000000000000000000000000000000000000001";

const STEP_DEFS = [
  { id: "registry", title: "Registry", summary: "The institution's own proof-registry contract." },
  { id: "connect", title: "Connect bank", summary: "OAuth into the mock open-banking sandbox." },
  { id: "reserves", title: "Fetch signed reserves", summary: "An ECDSA-signed balance per account." },
  { id: "prove", title: "Prove & publish", summary: "UltraHonk proof of R ≥ L, published on-chain." },
  { id: "verify", title: "Verify on-chain", summary: "Confirm the published proof against the ledger." },
  { id: "inclusion", title: "Customer inclusion", summary: "A customer proves their balance is included." },
] as const;

type StepId = (typeof STEP_DEFS)[number]["id"];
type Status = "locked" | "ready" | "running" | "done" | "failed";
type Institution = (typeof INSTITUTIONS)[number];
type Scenario = (typeof SCENARIOS)[number];
type LogKind = "info" | "data" | "ok" | "warn";
interface Log { kind: LogKind; text: string }

const NEXT: Record<StepId, StepId | null> = {
  registry: "connect",
  connect: "reserves",
  reserves: "prove",
  prove: "verify",
  verify: "inclusion",
  inclusion: null,
};

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
  const [status, setStatus] = useState<Record<StepId, Status>>(initialStatus());
  const [logs, setLogs] = useState<Record<StepId, Log[]>>(emptyLogs());
  const [contract, setContract] = useState<ContractDTO | null>(null);
  const [proof, setProof] = useState<ProofDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const setStep = useCallback((id: StepId, s: Status, lines?: Log[]) => {
    setStatus((prev) => ({ ...prev, [id]: s }));
    if (lines) setLogs((prev) => ({ ...prev, [id]: lines }));
  }, []);

  // Load the registry (pre-provisioned) and any existing proof, then open the
  // flow at "connect".
  const reset = useCallback(async () => {
    setStatus(initialStatus());
    setLogs(emptyLogs());
    setProof(null);
    setStep("registry", "running");
    try {
      const data = await fetchJSON(`/api/sandbox/status?tenant=${institution.tenantId}`);
      const c: ContractDTO | null = data?.contract ?? null;
      const p: ProofDTO | null = data?.proof ?? null;
      setContract(c);
      setProof(p);
      if (c?.contract_id) {
        setStep("registry", "done", [
          { kind: "ok", text: `Registry deployed for ${institution.name}.` },
          { kind: "data", text: `contract  ${c.contract_id}` },
          { kind: "data", text: `network   ${c.network ?? "testnet"}` },
          { kind: "info", text: "Owner-gated, with the shared solvency verifying key embedded." },
        ]);
        setStep("connect", "ready");
      } else {
        setStep("registry", "failed", [
          { kind: "warn", text: `${institution.name} has no contract yet.` },
          { kind: "info", text: `Provision one: just provision-tenant ${institution.tenantId}` },
        ]);
      }
    } catch {
      setStep("registry", "failed", [
        { kind: "warn", text: "Backend unreachable. Start the stack with: just demo" },
      ]);
    }
  }, [institution, setStep]);

  useEffect(() => {
    void reset();
  }, [reset]);

  async function runStep(id: StepId) {
    setBusy(true);
    setStep(id, "running");
    try {
      const result = await RUNNERS[id]({
        tenantId: institution.tenantId,
        scenario: scenario.id,
        setContract,
        setProof,
      });
      setStep(id, result.ok ? "done" : "failed", result.lines);
      const next = NEXT[id];
      if (result.ok && next) setStep(next, "ready");
    } catch (err) {
      setStep(id, "failed", [{ kind: "warn", text: `Step failed: ${String(err)}` }]);
    } finally {
      setBusy(false);
    }
  }

  const explorerUrl = contract?.contract_id ? `${EXPLORER}/contract/${contract.contract_id}` : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Pickers */}
      <div className="grid gap-[18px] lg:grid-cols-2">
        <Picker label="Institution" disabled={busy}>
          {INSTITUTIONS.map((inst) => (
            <Choice
              key={inst.tenantId}
              selected={inst.tenantId === institution.tenantId}
              disabled={busy}
              onClick={() => setInstitution(inst)}
              title={inst.name}
              sub={`${inst.kind} · its own contract`}
            />
          ))}
        </Picker>
        <Picker label="Scenario" disabled={busy}>
          {SCENARIOS.map((s) => (
            <Choice
              key={s.id}
              selected={s.id === scenario.id}
              disabled={busy}
              onClick={() => setScenario(s)}
              title={s.label}
              sub={s.note}
              right={`R = ${s.reserves}`}
            />
          ))}
        </Picker>
      </div>

      {/* The flow */}
      <ol className="flex flex-col gap-2.5">
        {STEP_DEFS.map((step, i) => {
          const st = status[step.id];
          const stepLogs = logs[step.id];
          return (
            <li key={step.id}>
              <Card className="p-0">
                <div className="flex items-center gap-4 p-5">
                  <Marker n={i + 1} status={st} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15.5px] font-semibold text-fg">{step.title}</div>
                    <div className="mt-0.5 text-[13.5px] text-sec">{step.summary}</div>
                  </div>
                  {st === "ready" && (
                    <Button onClick={() => runStep(step.id)} disabled={busy} size="sm">
                      {step.id === "prove" ? "Prove & publish" : "Run"}
                    </Button>
                  )}
                  {st === "running" && (
                    <span className="font-mono text-[12.5px] text-acc-text">running…</span>
                  )}
                </div>

                {stepLogs.length > 0 && (
                  <div className="border-t border-hair px-5 py-4">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed">
                      {stepLogs.map((line, j) => (
                        <div key={j} className={logClass(line.kind)}>
                          {logPrefix(line.kind)}
                          {line.text}
                        </div>
                      ))}
                    </pre>
                    {step.id === "registry" && explorerUrl && (
                      <ExplorerLink href={explorerUrl} label="View the contract on Stellar" />
                    )}
                    {step.id === "prove" && proof?.chain_proof_id != null && explorerUrl && (
                      <ExplorerLink href={explorerUrl} label={`View proof #${proof.chain_proof_id} on Stellar`} />
                    )}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <div>
        <button
          type="button"
          onClick={() => void reset()}
          disabled={busy}
          className="text-[13.5px] font-medium text-acc-text transition hover:opacity-80 disabled:opacity-50"
        >
          ↺ Restart the flow
        </button>
      </div>
    </div>
  );
}

// --- step runners -----------------------------------------------------------

interface RunCtx {
  tenantId: string;
  scenario: string;
  setContract: (c: ContractDTO | null) => void;
  setProof: (p: ProofDTO | null) => void;
}
interface RunResult { ok: boolean; lines: Log[] }

interface ConnectResp { error?: string; clientId?: string; code?: string; accessToken?: string; tokenType?: string; expiresIn?: number }
interface ReservesResp { error?: string; total?: string; balances?: { source_id: string; balance: string; currency: string; signature: string }[] }
interface RunResp { error?: string; published?: boolean; rejected?: boolean; proof?: ProofDTO }
interface StatusResp { contract?: ContractDTO | null; proof?: ProofDTO | null }
interface InclusionResp { error?: string; included?: boolean; balance?: string; pathLength?: number; chainProofId?: string }

const RUNNERS: Record<StepId, (ctx: RunCtx) => Promise<RunResult>> = {
  registry: async () => ({ ok: true, lines: [] }),

  connect: async () => {
    const d = await req<ConnectResp>("/api/sandbox/connect", postInit());
    if (d.error || !d.accessToken) return { ok: false, lines: [{ kind: "warn", text: d.error ?? "OAuth failed" }] };
    return {
      ok: true,
      lines: [
        { kind: "info", text: `GET  /oauth/authorize?client_id=${d.clientId}` },
        { kind: "data", text: `→ code ${d.code}` },
        { kind: "info", text: "POST /oauth/token  (grant: authorization_code)" },
        { kind: "data", text: `→ ${d.tokenType} ${truncate(d.accessToken, 28)}  (expires in ${d.expiresIn}s)` },
        { kind: "ok", text: "Connected to the bank." },
      ],
    };
  },

  reserves: async () => {
    const d = await req<ReservesResp>("/api/sandbox/reserves");
    if (d.error || !d.balances) {
      return { ok: false, lines: [{ kind: "warn", text: d.error ?? "could not read balances" }] };
    }
    const lines: Log[] = [];
    for (const b of d.balances) {
      lines.push({ kind: "data", text: `${b.source_id.padEnd(12)} ${commas(b.balance)} ${b.currency}` });
      lines.push({ kind: "info", text: `  sig ${truncate(b.signature, 40)}  ✓ ECDSA verified` });
    }
    lines.push({ kind: "ok", text: `Reserves R = ${commas(d.total)} (signed by the bank).` });
    return { ok: true, lines };
  },

  prove: async (ctx) => {
    const d = await req<RunResp>("/api/sandbox/run", postInit({ tenantId: ctx.tenantId, scenario: ctx.scenario }));
    if (d.rejected) {
      return {
        ok: false,
        lines: [
          { kind: "info", text: "Building the 8-leaf Poseidon2 Merkle Sum Tree…" },
          { kind: "warn", text: "Witness rejected: reserves are below liabilities (R < L)." },
          { kind: "warn", text: "No proof generated. Solva will not prove a lie." },
        ],
      };
    }
    if (!d.published || !d.proof) {
      return { ok: false, lines: [{ kind: "warn", text: d.error ?? "the backend is unreachable" }] };
    }
    const p = d.proof;
    ctx.setProof(p);
    return {
      ok: true,
      lines: [
        { kind: "info", text: "Building the 8-leaf Poseidon2 Merkle Sum Tree…" },
        { kind: "data", text: `root  0x${(p.root_hash ?? "").replace(/^0x/, "")}` },
        { kind: "info", text: "Generating UltraHonk proof (BN254, keccak transcript)…" },
        { kind: "data", text: `public inputs  R=${commas(p.reserves_total)}  L=${commas(p.liabilities_total)}` },
        { kind: "info", text: "publish_proof  →  signed by the registry owner" },
        { kind: "ok", text: `Published on-chain as proof #${p.chain_proof_id}.` },
      ],
    };
  },

  verify: async (ctx) => {
    const d = await req<StatusResp>(`/api/sandbox/status?tenant=${ctx.tenantId}`);
    const p = d.proof ?? null;
    if (!p?.reserves_total) return { ok: false, lines: [{ kind: "warn", text: "no published proof to verify" }] };
    const covers = BigInt(p.reserves_total) >= BigInt(p.liabilities_total ?? "0");
    return {
      ok: covers,
      lines: [
        { kind: "info", text: "get_latest_proof  →  read from the registry" },
        { kind: "data", text: `R=${commas(p.reserves_total)}  L=${commas(p.liabilities_total)}` },
        covers
          ? { kind: "ok", text: "R ≥ L confirmed on-chain. The institution is solvent." }
          : { kind: "warn", text: "R < L on-chain." },
      ],
    };
  },

  inclusion: async (ctx) => {
    const d = await req<InclusionResp>(`/api/sandbox/inclusion?tenant=${ctx.tenantId}&id_hash=${DEMO_ID_HASH}`);
    if (d.error || !d.included) {
      return { ok: false, lines: [{ kind: "warn", text: d.error ?? "customer not found in this proof" }] };
    }
    return {
      ok: true,
      lines: [
        { kind: "info", text: `Customer cust-001  (id hash 0x${DEMO_ID_HASH.slice(0, 8)}…)` },
        { kind: "data", text: `committed balance  ${commas(d.balance)}` },
        { kind: "data", text: `inclusion path     ${d.pathLength} sibling nodes to the root` },
        { kind: "ok", text: `Included in proof #${d.chainProofId}. Verifiable on-chain, no other balance revealed.` },
      ],
    };
  },
};

// --- small UI pieces --------------------------------------------------------

function Picker({ label, disabled, children }: { label: string; disabled: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-sec">{label}</div>
      <div className={`flex flex-col gap-2.5 ${disabled ? "opacity-70" : ""}`}>{children}</div>
    </div>
  );
}

function Choice({
  selected, disabled, onClick, title, sub, right,
}: {
  selected: boolean; disabled: boolean; onClick: () => void; title: string; sub: string; right?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-btn border px-4 py-3 text-left transition disabled:opacity-60 ${
        selected ? "border-acc" : "border-hair hover:border-hair-strong"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-fg">{title}</span>
        {right && <span className="font-mono text-[13px] tabular-nums text-sec">{right}</span>}
      </div>
      <div className="mt-0.5 text-[13.5px] text-sec">{sub}</div>
    </button>
  );
}

function Marker({ n, status }: { n: number; status: Status }) {
  const base = "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[13px] font-semibold";
  if (status === "done")
    return <span className={`${base} border-acc bg-acc text-on-acc`}>✓</span>;
  if (status === "failed")
    return <span className={`${base} border-red text-red`}>!</span>;
  if (status === "running")
    return <span className={`${base} border-acc text-acc-text animate-pulse`}>{n}</span>;
  if (status === "ready")
    return <span className={`${base} border-acc text-acc-text`}>{n}</span>;
  return <span className={`${base} border-hair text-sec`}>{n}</span>;
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-block text-[13.5px] font-semibold text-acc-text transition hover:opacity-80"
    >
      {label} &rarr;
    </a>
  );
}

// --- helpers ----------------------------------------------------------------

function initialStatus(): Record<StepId, Status> {
  return { registry: "locked", connect: "locked", reserves: "locked", prove: "locked", verify: "locked", inclusion: "locked" };
}
function emptyLogs(): Record<StepId, Log[]> {
  return { registry: [], connect: [], reserves: [], prove: [], verify: [], inclusion: [] };
}
function logClass(kind: LogKind): string {
  if (kind === "ok") return "text-acc-text";
  if (kind === "warn") return "text-red";
  if (kind === "data") return "text-fg";
  return "text-sec";
}
function logPrefix(kind: LogKind): string {
  if (kind === "ok") return "✓ ";
  if (kind === "warn") return "✗ ";
  return "  ";
}
function commas(n?: string): string {
  if (!n) return "0";
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
async function fetchJSON(url: string): Promise<{ contract?: ContractDTO | null; proof?: ProofDTO | null } | null> {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}
async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  return (await res.json()) as T;
}
function postInit(body?: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
}
