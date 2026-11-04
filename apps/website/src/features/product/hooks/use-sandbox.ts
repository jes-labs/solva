"use client";

import { useEffect, useState } from "react";
import {
  DEMO_ID_HASH,
  INSTITUTIONS,
  NEXT_STEP,
  SCENARIOS,
  connectLines,
  emptyLogs,
  inclusionLines,
  initialStatus,
  publishedLines,
  registryLines,
  rejectedLines,
  reservesLines,
  verifyLines,
  type ContractDTO,
  type Institution,
  type LogLine,
  type ProofDTO,
  type Scenario,
  type StepId,
  type StepStatus,
} from "../lib/sandbox";

interface RunResult {
  ok: boolean;
  lines: LogLine[];
  retry?: boolean;
}

interface Registry {
  reachable: boolean;
  contract: ContractDTO | null;
  proof: ProofDTO | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  return (await res.json()) as T;
}

function post(body?: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
}

async function loadRegistry(tenantId: string): Promise<Registry> {
  try {
    const res = await fetch(`/api/sandbox/status?tenant=${tenantId}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { contract?: ContractDTO | null; proof?: ProofDTO | null };
    return { reachable: true, contract: data.contract ?? null, proof: data.proof ?? null };
  } catch {
    return { reachable: false, contract: null, proof: null };
  }
}

function startingStatus(): Record<StepId, StepStatus> {
  const status = initialStatus();
  status.registry = "running";
  return status;
}

export function useSandbox() {
  const [institution, setInstitutionState] = useState<Institution>(INSTITUTIONS[0]);
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [status, setStatus] = useState<Record<StepId, StepStatus>>(startingStatus);
  const [logs, setLogs] = useState<Record<StepId, LogLine[]>>(emptyLogs);
  const [contract, setContract] = useState<ContractDTO | null>(null);
  const [proof, setProof] = useState<ProofDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [runId, setRunId] = useState(0);

  function setStep(id: StepId, next: StepStatus, lines?: LogLine[]) {
    setStatus((prev) => ({ ...prev, [id]: next }));
    if (lines) setLogs((prev) => ({ ...prev, [id]: lines }));
  }

  function clear() {
    setStatus(startingStatus());
    setLogs(emptyLogs());
    setProof(null);
  }

  function setInstitution(next: Institution) {
    setInstitutionState(next);
    clear();
  }

  function reset() {
    clear();
    setRunId((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;
    void loadRegistry(institution.tenantId).then((registry) => {
      if (cancelled) return;
      setReachable(registry.reachable);
      setContract(registry.contract);
      setProof(registry.proof);
      if (!registry.reachable) {
        setStatus((prev) => ({ ...prev, registry: "failed" }));
        setLogs((prev) => ({
          ...prev,
          registry: [
            {
              kind: "warn",
              text: "The sandbox backend is not reachable from this page right now.",
            },
          ],
        }));
        return;
      }
      if (registry.contract?.contract_id) {
        setStatus((prev) => ({ ...prev, registry: "done", connect: "ready" }));
        setLogs((prev) => ({
          ...prev,
          registry: registryLines(institution, registry.contract ?? {}),
        }));
      } else {
        setStatus((prev) => ({ ...prev, registry: "failed" }));
        setLogs((prev) => ({
          ...prev,
          registry: [
            { kind: "warn", text: `${institution.name} has no registry entry on Testnet yet.` },
          ],
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [institution, runId]);

  const runners: Record<StepId, () => Promise<RunResult>> = {
    registry: async () => ({ ok: true, lines: [] }),
    connect: async () => {
      const data = await request<{
        error?: string;
        clientId?: string;
        code?: string;
        accessToken?: string;
        tokenType?: string;
        expiresIn?: number;
      }>("/api/sandbox/connect", post());
      if (data.error || !data.accessToken) {
        return { ok: false, lines: [{ kind: "warn", text: data.error ?? "authorisation failed" }] };
      }
      return { ok: true, lines: connectLines({ ...data, accessToken: data.accessToken }) };
    },
    reserves: async () => {
      const data = await request<{
        error?: string;
        total?: string;
        balances?: { source_id: string; balance: string; currency: string; signature: string }[];
      }>("/api/sandbox/reserves");
      if (data.error || !data.balances) {
        return {
          ok: false,
          lines: [{ kind: "warn", text: data.error ?? "could not read the signed balances" }],
        };
      }
      return { ok: true, lines: reservesLines(data.balances, data.total) };
    },
    prove: async () => {
      const data = await request<{
        error?: string;
        published?: boolean;
        rejected?: boolean;
        busy?: boolean;
        proof?: ProofDTO;
      }>("/api/sandbox/run", post({ tenantId: institution.tenantId, scenario: scenario.id }));
      if (data.busy) {
        return {
          ok: false,
          retry: true,
          lines: [
            {
              kind: "warn",
              text: "Another run is in progress for this institution. Give it a moment and run again.",
            },
          ],
        };
      }
      if (data.rejected) return { ok: false, lines: rejectedLines() };
      if (!data.published || !data.proof) {
        return {
          ok: false,
          lines: [{ kind: "warn", text: data.error ?? "the backend is unreachable" }],
        };
      }
      setProof(data.proof);
      return { ok: true, lines: publishedLines(data.proof) };
    },
    verify: async () => {
      const data = await request<{ proof?: ProofDTO | null }>(
        `/api/sandbox/status?tenant=${institution.tenantId}`,
      );
      const latest = data.proof ?? null;
      if (!latest?.reserves_total) {
        return { ok: false, lines: [{ kind: "warn", text: "no published proof to check" }] };
      }
      const result = verifyLines(latest);
      return { ok: result.covers, lines: result.lines };
    },
    inclusion: async () => {
      const data = await request<{
        error?: string;
        included?: boolean;
        balance?: string;
        pathLength?: number;
        chainProofId?: string;
      }>(`/api/sandbox/inclusion?tenant=${institution.tenantId}&id_hash=${DEMO_ID_HASH}`);
      if (data.error || !data.included) {
        return {
          ok: false,
          lines: [{ kind: "warn", text: data.error ?? "holder not found in this proof" }],
        };
      }
      return { ok: true, lines: inclusionLines(data) };
    },
  };

  async function run(id: StepId) {
    setBusy(true);
    setStep(id, "running");
    try {
      const result = await runners[id]();
      if (!result.ok && result.retry) {
        setStep(id, "ready", result.lines);
      } else {
        setStep(id, result.ok ? "done" : "failed", result.lines);
        const next = NEXT_STEP[id];
        if (result.ok && next) setStep(next, "ready");
      }
    } catch (error) {
      setStep(id, "failed", [{ kind: "warn", text: `Step failed: ${String(error)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return {
    institution,
    setInstitution,
    scenario,
    setScenario,
    status,
    logs,
    contract,
    proof,
    busy,
    reachable,
    run,
    reset,
  };
}
