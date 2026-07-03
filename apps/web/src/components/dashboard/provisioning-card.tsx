"use client";

import { useState } from "react";
import { Button } from "@solva/ui";
import { cn } from "@solva/ui";
import { CopyButton } from "@/components/copy-button";
import { truncateMiddle } from "@/lib/format";
import { useSession } from "@/lib/session/provider";

// Provisions the institution's tenant end to end (#131): create the tenant and
// record the passkey wallet, deploy the registry owned by the wallet (an
// explicit operator step), then record the deployed contract.
export function ProvisioningCard() {
  const { session } = useSession();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [deployCommand, setDeployCommand] = useState<string | null>(null);
  const [contractId, setContractId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!session) return null;
  const name = session.institution.legalName || "My Institution";
  const wallet = session.walletAddress;
  const regValid = contractId.trim().startsWith("C") && contractId.trim().length === 56;

  async function create() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, plan: "growth", wallet }),
      });
      const d = (await res.json()) as { tenantId?: string; deployCommand?: string; error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setTenantId(d.tenantId ?? null);
      setDeployCommand(d.deployCommand ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function record() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/provision", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, contractId: contractId.trim(), network: "testnet" }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-hair bg-surface p-6">
      <h2 className="font-display text-[16px] font-semibold tracking-tight">Registry provisioning</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-sec">
        Create your institution, record your passkey wallet, and deploy a proof registry owned by that
        wallet so publishing is authorized through it.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="shrink-0 text-[13px] text-sec">Wallet</span>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="truncate font-mono text-[14px] text-fg" title={wallet}>
            {truncateMiddle(wallet, 8, 6)}
          </span>
          <CopyButton value={wallet} label="Copy wallet address" />
        </span>
      </div>

      {/* Step 1: create the tenant and record the wallet */}
      <ol className="mt-6 space-y-4">
        <Step n={1} label="Create your institution and record the wallet" done={!!tenantId}>
          {!tenantId && (
            <Button onClick={create} disabled={busy} size="sm" className="mt-2">
              {busy ? "Creating…" : "Create institution"}
            </Button>
          )}
          {tenantId && (
            <p className="mt-1 font-mono text-[12px] text-sec">tenant {truncateMiddle(tenantId, 8, 6)}</p>
          )}
        </Step>

        {/* Step 2: deploy the wallet-owned registry (operator step) */}
        {deployCommand && (
          <Step n={2} label="Deploy your registry, owned by your wallet" done={done}>
            <p className="mt-1 text-[12.5px] text-sec">Run this on a machine with the Stellar CLI:</p>
            <div className="mt-2 flex items-start justify-between gap-3 rounded-btn border border-hair bg-bg px-3.5 py-2.5">
              <code className="min-w-0 break-all font-mono text-[12px] text-fg">{deployCommand}</code>
              <CopyButton value={deployCommand} label="Copy deploy command" />
            </div>
          </Step>
        )}

        {/* Step 3: record the deployed contract */}
        {deployCommand && !done && (
          <Step n={3} label="Record your deployed registry" done={done}>
            <input
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              placeholder="C… (the deployed registry id)"
              spellCheck={false}
              className={cn(
                "mt-2 w-full rounded-btn border bg-bg px-3.5 py-[11px] font-mono text-[14px] text-fg placeholder:text-sec focus:outline-none",
                contractId.trim().length > 0 && !regValid
                  ? "border-red focus:border-red"
                  : "border-hair focus:border-acc-text",
              )}
            />
            <Button onClick={record} disabled={busy || !regValid} size="sm" className="mt-3">
              {busy ? "Recording…" : "Record registry"}
            </Button>
          </Step>
        )}
      </ol>

      {error && (
        <p className="mt-4 rounded-btn border border-red/40 bg-red/10 px-3.5 py-2.5 text-[13px] text-red">
          {error}
        </p>
      )}

      {done && (
        <p className="mt-4 rounded-btn border border-hair bg-panel px-3.5 py-2.5 text-[13px] text-fg">
          Provisioned. Your registry is recorded. Next, grant the orchestrator a scoped signer in the
          Publishing tab so it can publish for you.
        </p>
      )}
    </div>
  );
}

function Step({
  n,
  label,
  done,
  children,
}: {
  n: number;
  label: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
          done ? "bg-acc text-on-acc" : "border border-hair-strong text-sec",
        )}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[13.5px] text-fg">{label}</span>
        {children}
      </div>
    </li>
  );
}
