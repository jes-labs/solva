"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Landmark, ShieldCheck, Wallet } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@solva/ui";
import type { SourceType } from "@/lib/mock/dashboard";

const inputClass =
  "w-full rounded-btn border border-hair bg-bg px-3.5 py-[11px] text-[15px] text-fg placeholder:text-sec focus:border-acc-text";

// Mock open-banking providers. A real integration lists the banks an AISP
// (Plaid, TrueLayer, Tink, ...) supports for the institution's region.
const BANKS = ["First National Bank", "Meridian Bank", "Northbridge", "Sterling Trust", "Atlas Federal"];

type Step = "choose" | "banks" | "consent" | "wallet";

// The connect-source flow, shaped like real reserve sourcing: a bank balance is
// read over open banking with an explicit read-only consent, or an on-chain
// wallet is added by address. The dialog handles focus, escape, and labelling
// through the Radix primitive from @solva/ui.
export function ConnectSourceDialog({
  onConnect,
}: {
  onConnect: (config: { type: SourceType; label: string; settings: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [bank, setBank] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("choose");
    setBank("");
    setWalletLabel("");
    setWalletAddress("");
    setBusy(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function finish(config: { type: SourceType; label: string; settings: string }) {
    setBusy(true);
    await onConnect(config);
    close();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        Connect a source
      </Button>

      <DialogContent className="rounded-card border-hair">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect a reserve source</DialogTitle>
              <DialogDescription className="text-sec">
                Add a bank balance over open banking, or an on-chain wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <ChoiceCard
                icon={Landmark}
                title="Bank account"
                detail="Read balances over open banking. Read-only, with your consent."
                onClick={() => setStep("banks")}
              />
              <ChoiceCard
                icon={Wallet}
                title="On-chain wallet"
                detail="Add a wallet holding by its address."
                onClick={() => setStep("wallet")}
              />
            </div>
          </>
        )}

        {step === "banks" && (
          <>
            <BackHeader title="Choose your bank" onBack={() => setStep("choose")} />
            <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
              {BANKS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setBank(name);
                    setStep("consent");
                  }}
                  className="flex w-full items-center justify-between rounded-btn border border-hair px-4 py-3 text-left transition-colors hover:border-hair-strong"
                >
                  <span className="text-[14.5px] font-medium text-fg">{name}</span>
                  <ChevronRight className="size-4 text-sec" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "consent" && (
          <>
            <BackHeader title="Authorize access" onBack={() => setStep("banks")} />
            <div className="rounded-btn border border-hair bg-bg p-5 text-center">
              <ShieldCheck className="mx-auto size-8 text-acc-text" />
              <p className="mt-3 text-[14.5px] text-fg">
                Allow Solva to read balances from <span className="font-medium">{bank}</span>.
              </p>
              <p className="mx-auto mt-1.5 max-w-[360px] text-[13px] leading-relaxed text-sec">
                Read-only access to account balances. Solva never moves funds and never sees
                transactions. You can revoke access at any time.
              </p>
            </div>
            <Button
              disabled={busy}
              onClick={() => finish({ type: "openbanking", label: bank, settings: "read-only balance consent" })}
              className="w-full"
            >
              {busy ? "Connecting…" : "Authorize and connect"}
            </Button>
          </>
        )}

        {step === "wallet" && (
          <>
            <BackHeader title="Add an on-chain wallet" onBack={() => setStep("choose")} />
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-fg">Display name</span>
                <input
                  value={walletLabel}
                  onChange={(e) => setWalletLabel(e.target.value)}
                  placeholder="Treasury wallet"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-fg">Wallet address</span>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="G…"
                  className={cn(inputClass, "font-mono")}
                />
              </label>
            </div>
            <Button
              disabled={busy || !walletLabel.trim() || !walletAddress.trim()}
              onClick={() =>
                finish({ type: "onchain", label: walletLabel.trim(), settings: walletAddress.trim() })
              }
              className="w-full"
            >
              {busy ? "Connecting…" : "Connect wallet"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: typeof Landmark;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3.5 rounded-btn border border-hair p-4 text-left transition-colors hover:border-hair-strong"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-panel text-acc-text">
        <Icon className="size-[18px]" />
      </span>
      <span>
        <span className="block text-[14.5px] font-medium text-fg">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-sec">{detail}</span>
      </span>
    </button>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <DialogHeader>
      <button
        type="button"
        onClick={onBack}
        className="mb-1 inline-flex items-center gap-1 text-[13px] text-sec transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
  );
}
