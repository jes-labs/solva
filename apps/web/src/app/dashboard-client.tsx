"use client";

import { useState } from "react";
import { Button } from "@solva/ui";
import { authProvider, type SmartWalletSession } from "@/lib/auth";
import {
  connectSourceMock,
  initialDashboard,
  runCycleMock,
  type DashboardData,
  type SourceType,
} from "@/lib/mock/dashboard";
import { buildReport, downloadReport } from "@/lib/report";
import { StatusHero, type Schedule } from "@/components/dashboard/status-hero";
import { SourcesPanel } from "@/components/dashboard/sources-panel";
import { AuditLog } from "@/components/dashboard/audit-log";

// Institution dashboard. The orchestrating client: it owns the dashboard state
// and wires the panels. Actions go through mock orchestrator functions whose
// signatures mirror @solva/sdk-ts, so the SDK swap is mechanical. Passkey auth
// is its own issue; this keeps the stub sign-in gate.
export function DashboardClient() {
  const [session, setSession] = useState<SmartWalletSession | null>(null);

  if (!session) {
    return <SignIn onSignedIn={setSession} />;
  }

  return <Dashboard session={session} onSignOut={() => setSession(null)} />;
}

function SignIn({ onSignedIn }: { onSignedIn: (session: SmartWalletSession) => void }) {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const next = await authProvider.signIn();
    onSignedIn(next);
  }

  return (
    <div className="mx-auto max-w-[440px] py-10">
      <div className="rounded-card border border-hair bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-hair text-acc-text">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-[22px] font-bold tracking-tight">Sign in</h1>
        <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-sec">
          Use your passkey. No seed phrase. We provision a smart wallet for your institution on
          first sign-in.
        </p>
        <Button onClick={signIn} disabled={busy} className="mt-6 w-full">
          {busy ? "Signing in…" : "Sign in with passkey"}
        </Button>
      </div>
    </div>
  );
}

function Dashboard({
  session,
  onSignOut,
}: {
  session: SmartWalletSession;
  onSignOut: () => void;
}) {
  const [data, setData] = useState<DashboardData>(() => initialDashboard());
  const [running, setRunning] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>("manual");

  async function handleConnect(config: { type: SourceType; label: string; settings: string }) {
    const source = await connectSourceMock(config);
    setData((prev) => ({ ...prev, sources: [...prev.sources, source] }));
  }

  async function handleRunCycle() {
    setRunning(true);
    const record = await runCycleMock(data.cycles[0]);
    setData((prev) => ({ ...prev, cycles: [record, ...prev.cycles] }));
    setRunning(false);
  }

  function handleExport() {
    const report = buildReport(prettyTenant(session.tenant), data);
    downloadReport(`solva-report-${session.tenant}.txt`, report);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-acc-text">Institution dashboard</p>
          <h1 className="mt-1.5 font-display text-[clamp(24px,4vw,34px)] font-bold tracking-tight">
            {prettyTenant(session.tenant)}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-sec">
          <span>{session.label}</span>
          <button
            type="button"
            onClick={() => {
              void authProvider.signOut();
              onSignOut();
            }}
            className="rounded-btn border border-hair px-3 py-1.5 text-fg transition-colors hover:border-hair-strong"
          >
            Sign out
          </button>
        </div>
      </header>

      <StatusHero
        latest={data.cycles[0]}
        running={running}
        schedule={schedule}
        onRunCycle={handleRunCycle}
        onScheduleChange={setSchedule}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SourcesPanel sources={data.sources} onConnect={handleConnect} />
        <AuditLog cycles={data.cycles} onExport={handleExport} />
      </div>
    </div>
  );
}

// "demo-institution" -> "Demo Institution".
function prettyTenant(tenant: string): string {
  return tenant
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
