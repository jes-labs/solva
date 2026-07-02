"use client";

import { useState } from "react";
import { Button } from "@solva/ui";
import { cn } from "@solva/ui";
import { CopyButton } from "@/components/copy-button";
import { truncateMiddle } from "@/lib/format";
import { useSession } from "@/lib/session/provider";
import {
  addOrchestratorSigner,
  getSession,
  signWithPasskey,
  EXPLORER,
  type AddSignerPhase,
} from "@/lib/passkey";

type StepId = "session" | AddSignerPhase;
type Status = "pending" | "active" | "done" | "error";

const STEPS: { id: StepId; label: string }[] = [
  { id: "session", label: "Prepare the deployer account" },
  { id: "simulate", label: "Build the add-signer request" },
  { id: "sign", label: "Approve with your passkey" },
  { id: "submit", label: "Add the signer on-chain" },
];

function initialStatuses(): Record<StepId, Status> {
  return { session: "pending", simulate: "pending", sign: "pending", submit: "pending" };
}

function looksLikeAddress(value: string, prefix: "G" | "C"): boolean {
  return value.startsWith(prefix) && value.length === 56;
}

export function PublishingKeyCard() {
  const { session } = useSession();
  const [orchestrator, setOrchestrator] = useState("");
  const [registry, setRegistry] = useState("");
  const [statuses, setStatuses] = useState<Record<StepId, Status>>(initialStatuses);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!session) return null;

  const orchValid = looksLikeAddress(orchestrator.trim(), "G");
  const regValid = looksLikeAddress(registry.trim(), "C");
  const canRun = orchValid && regValid && !running;

  const set = (id: StepId, status: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  async function run() {
    setError(null);
    setTxHash(null);
    setStatuses(initialStatuses());
    setRunning(true);
    let current: StepId = "session";
    try {
      set("session", "active");
      const deployer = await getSession();
      set("session", "done");

      const hash = await addOrchestratorSigner({
        session: deployer,
        walletAddress: session!.walletAddress,
        orchestratorAddress: orchestrator.trim(),
        registryContract: registry.trim(),
        signPayload: (payload) => signWithPasskey({ challenge: payload }),
        onPhase: (phase) => {
          set(current, "done");
          current = phase;
          set(phase, "active");
        },
      });
      set(current, "done");
      setTxHash(hash);
    } catch (e) {
      set(current, "error");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-card border border-hair bg-surface p-6">
      <h2 className="font-display text-[16px] font-semibold tracking-tight">Publishing key</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-sec">
        Give the orchestrator a signer on your wallet so it can publish proofs for you. The signer is
        scoped to your registry contract only, and you approve it with your passkey.
      </p>

      <div className="mt-5 space-y-4">
        <Field
          label="Wallet"
          value={
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="truncate font-mono text-[14px] text-fg" title={session.walletAddress}>
                {truncateMiddle(session.walletAddress, 8, 6)}
              </span>
              <CopyButton value={session.walletAddress} label="Copy wallet address" />
            </span>
          }
        />
        <LabeledInput
          label="Orchestrator address (G…)"
          value={orchestrator}
          onChange={setOrchestrator}
          placeholder="G…"
          invalid={orchestrator.trim().length > 0 && !orchValid}
          disabled={running}
        />
        <LabeledInput
          label="Registry contract (C…)"
          value={registry}
          onChange={setRegistry}
          placeholder="C…"
          invalid={registry.trim().length > 0 && !regValid}
          disabled={running}
        />
      </div>

      <ol className="mt-6 space-y-2.5">
        {STEPS.map((step) => (
          <StepRow key={step.id} label={step.label} status={statuses[step.id]} />
        ))}
      </ol>

      {error && (
        <p className="mt-4 rounded-btn border border-red/40 bg-red/10 px-3.5 py-2.5 text-[13px] text-red">
          {error}
        </p>
      )}

      {txHash && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-btn border border-hair bg-bg px-4 py-3">
          <div>
            <div className="text-[13px] text-fg">Signer added.</div>
            <code className="font-mono text-[12px] text-sec">{truncateMiddle(txHash, 8, 8)}</code>
          </div>
          <a
            href={`${EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-acc-text underline underline-offset-2"
          >
            View on explorer
          </a>
        </div>
      )}

      <Button onClick={run} disabled={!canRun} className="mt-6">
        {running ? "Adding signer…" : "Add publishing signer"}
      </Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <span className="shrink-0 text-[13px] text-sec">{label}</span>
      {value}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  invalid,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid: boolean;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-sec">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          "mt-1.5 w-full rounded-btn border bg-bg px-3.5 py-[11px] font-mono text-[14px] text-fg placeholder:text-sec focus:outline-none",
          invalid ? "border-red focus:border-red" : "border-hair focus:border-acc-text",
        )}
      />
    </label>
  );
}

function StepRow({ label, status }: { label: string; status: Status }) {
  return (
    <li className="flex items-center gap-3">
      <StatusDot status={status} />
      <span
        className={cn(
          "text-[13.5px]",
          status === "pending" && "text-sec",
          status === "active" && "text-fg",
          status === "done" && "text-fg",
          status === "error" && "text-red",
        )}
      >
        {label}
      </span>
    </li>
  );
}

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        status === "pending" && "bg-hair-strong",
        status === "active" && "bg-acc animate-pulse",
        status === "done" && "bg-acc",
        status === "error" && "bg-red",
      )}
      aria-hidden
    />
  );
}
