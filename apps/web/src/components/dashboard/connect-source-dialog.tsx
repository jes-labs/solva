"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from "@solva/ui";
import type { SourceType } from "@/lib/mock/dashboard";

const inputClass =
  "w-full rounded-btn border border-hair bg-bg px-3.5 py-[11px] text-[15px] text-fg placeholder:text-sec focus:border-acc-text";

const TYPES: { value: SourceType; title: string; detail: string }[] = [
  { value: "openbanking", title: "Open banking", detail: "Signed bank balance" },
  { value: "onchain", title: "On-chain wallet", detail: "Wallet holding" },
];

// The connect-source flow on the Radix dialog from @solva/ui, which handles
// focus trapping, escape, and labelling. Submitting calls onConnect and closes.
export function ConnectSourceDialog({
  onConnect,
}: {
  onConnect: (config: { type: SourceType; label: string; settings: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SourceType>("openbanking");
  const [label, setLabel] = useState("");
  const [settings, setSettings] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setType("openbanking");
    setLabel("");
    setSettings("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    await onConnect({ type, label: label.trim(), settings: settings.trim() });
    setBusy(false);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Connect a source
      </Button>
      <DialogContent className="rounded-card border-hair">
        <DialogHeader>
          <DialogTitle>Connect a reserve source</DialogTitle>
          <DialogDescription className="text-sec">
            Link a bank balance or an on-chain wallet that backs your reserves.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="eyebrow mb-2 block text-sec">Source type</span>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((option) => {
                const selected = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-btn border p-3 text-left transition-colors",
                      selected
                        ? "border-acc bg-[color-mix(in_oklab,var(--acc)_8%,transparent)]"
                        : "border-hair hover:border-hair-strong",
                    )}
                  >
                    <div className="text-sm font-medium text-fg">{option.title}</div>
                    <div className="text-[12px] text-sec">{option.detail}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="source-label" className="eyebrow mb-2 block text-sec">
              Display name
            </label>
            <input
              id="source-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="First National Bank"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="source-settings" className="eyebrow mb-2 block text-sec">
              {type === "openbanking" ? "Institution or OAuth client" : "Wallet address"}
            </label>
            <input
              id="source-settings"
              value={settings}
              onChange={(e) => setSettings(e.target.value)}
              placeholder={type === "openbanking" ? "client id" : "G…"}
              className={cn(inputClass, type === "onchain" && "font-mono")}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={busy || !label.trim()}>
              {busy ? "Connecting…" : "Connect source"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
