"use client";

import { useState } from "react";
import { Button } from "@solva/ui";
import { cn } from "@solva/ui";
import { CopyButton } from "@/components/copy-button";
import { truncateMiddle } from "@/lib/format";
import { useSession } from "@/lib/session/provider";
import { can, ROLE_LABELS, type Action } from "@/lib/session/permissions";
import { INSTITUTION_TYPE_LABELS, type Role, type Session } from "@/lib/session/types";

type TabId = "institution" | "team" | "disclosures" | "keys";

const TABS: { id: TabId; label: string; requires?: Action }[] = [
  { id: "institution", label: "Institution" },
  { id: "team", label: "Team & roles", requires: "team.manage" },
  { id: "disclosures", label: "Disclosures", requires: "disclosure.manage" },
  { id: "keys", label: "Developer keys", requires: "keys.manage" },
];

export function SettingsSection() {
  const { session } = useSession();
  const [tab, setTab] = useState<TabId>("institution");
  if (!session) return null;
  const role = session.role;
  const tabs = TABS.filter((t) => !t.requires || can(role, t.requires));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-hair">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors",
              tab === t.id
                ? "border-acc text-fg"
                : "border-transparent text-sec hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "institution" && <InstitutionTab session={session} />}
      {tab === "team" && <TeamTab role={role} operatorLabel={session.operatorLabel} />}
      {tab === "disclosures" && <DisclosuresTab />}
      {tab === "keys" && <KeysTab />}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-card border border-hair bg-surface p-6">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hair py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-sec">{label}</span>
      <span className="min-w-0 break-words text-right text-[14px] text-fg">{value || "—"}</span>
    </div>
  );
}

function InstitutionTab({ session }: { session: Session }) {
  const inst = session.institution;
  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">Institution</h2>
        <span className="rounded-pill border border-acc-deep px-2.5 py-1 font-mono text-[11px] text-acc-text">
          KYB approved
        </span>
      </div>
      <Row label="Legal name" value={inst.legalName} />
      <Row label="Type" value={INSTITUTION_TYPE_LABELS[inst.type]} />
      <Row label="Jurisdiction" value={inst.jurisdiction} />
      <Row label="Registration number" value={inst.registrationNumber} />
      <Row label="Compliance contact" value={`${inst.contactName} · ${inst.contactEmail}`} />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
        <span className="shrink-0 text-[13px] text-sec">Wallet</span>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="truncate font-mono text-[14px] text-fg" title={session.walletAddress}>
            {truncateMiddle(session.walletAddress, 8, 6)}
          </span>
          <CopyButton value={session.walletAddress} label="Copy wallet address" />
        </span>
      </div>
    </Panel>
  );
}

function TeamTab({ role, operatorLabel }: { role: Role; operatorLabel: string }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">Team & roles</h2>
        <Button variant="outline" size="sm" disabled>
          Invite member
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-btn border border-hair px-4 py-3">
        <div>
          <div className="text-[14px] font-medium text-fg">You</div>
          <div className="font-mono text-[12px] text-sec">{operatorLabel}</div>
        </div>
        <span className="rounded-pill bg-panel px-2.5 py-1 text-[12px] text-fg">
          {ROLE_LABELS[role]}
        </span>
      </div>
      <p className="mt-4 text-[12.5px] leading-relaxed text-sec">
        Roles scope what each member can do: owners manage everything, operators run cycles and
        connect sources, compliance handles disclosures and exports, viewers read only.
      </p>
    </Panel>
  );
}

function DisclosuresTab() {
  return (
    <Panel>
      <h2 className="font-display text-[16px] font-semibold tracking-tight">Selective disclosures</h2>
      <p className="mt-1 text-[13px] text-sec">
        Share a single attested figure with a supervisor without exposing anything else.
      </p>
      <div className="mt-5 rounded-btn border border-dashed border-hair-strong px-6 py-10 text-center">
        <p className="text-[13.5px] text-sec">No disclosures yet.</p>
        <Button variant="outline" size="sm" disabled className="mt-3">
          Create disclosure
        </Button>
      </div>
    </Panel>
  );
}

function KeysTab() {
  const demoKey = "sk_live_solva_9f3a8c2e1b7d4a6f0e5c9d2a";
  return (
    <Panel>
      <h2 className="font-display text-[16px] font-semibold tracking-tight">Developer keys</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-sec">
        Your systems automate the same actions as this dashboard through{" "}
        <span className="font-mono text-fg">@solva/sdk-ts</span> using this key: connect sources, run
        cycles, and read proofs.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-btn border border-hair bg-bg px-4 py-3">
        <code className="font-mono text-[13px] text-fg">{`${demoKey.slice(0, 16)}••••••••`}</code>
        <CopyButton value={demoKey} label="Copy API key" />
      </div>
    </Panel>
  );
}
