"use client";

import { useEffect, useState } from "react";
import { Button } from "@solva/ui";
import { authProvider, type PasskeyPhase, type SmartWalletSession } from "@/lib/auth";
// Import from the leaf module, not the barrel, so the heavy stellar-sdk path
// (provision) stays out of the dashboard's initial bundle.
import { detectPasskeySupport } from "@/lib/passkey/capabilities";
import {
  connectSourceMock,
  initialDashboard,
  runCycleMock,
  type DashboardData,
  type SourceType,
} from "@/lib/mock/dashboard";
import { buildReport, downloadReport } from "@/lib/report";
import { Spinner } from "@/components/spinner";
import { StatusHero, type Schedule } from "@/components/dashboard/status-hero";
import { SourcesPanel } from "@/components/dashboard/sources-panel";
import { AuditLog } from "@/components/dashboard/audit-log";

// Institution dashboard. The orchestrating client: it owns the dashboard state
// and wires the panels. Actions go through mock orchestrator functions whose
// signatures mirror @solva/sdk-ts, so the SDK swap is mechanical. Publishing is
// gated behind a passkey smart-wallet sign-in (lib/auth).
export function DashboardClient() {
  const [session, setSession] = useState<SmartWalletSession | null>(null);

  if (!session) {
    return <SignIn onSignedIn={setSession} />;
  }

  return <Dashboard session={session} onSignOut={() => setSession(null)} />;
}

const PHASE_LABEL: Record<PasskeyPhase, string> = {
  checking: "Checking your device…",
  registering: "Waiting for your passkey…",
  authenticating: "Waiting for your passkey…",
  provisioning: "Provisioning your wallet…",
};

function SignIn({ onSignedIn }: { onSignedIn: (session: SmartWalletSession) => void }) {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<PasskeyPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);

  // Detect support up front so an unusable device gets a clear message, not a
  // failed prompt.
  useEffect(() => {
    let active = true;
    void detectPasskeySupport().then((support) => {
      if (active && !support.supported) setUnsupported(support.reason ?? "Passkeys are unavailable.");
    });
    return () => {
      active = false;
    };
  }, []);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const next = await authProvider.signIn({ onPhase: setPhase });
      onSignedIn(next);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Sign-in failed.";
      // The browser throws NotAllowedError when the prompt is dismissed.
      setError(
        message.includes("NotAllowed") || message.toLowerCase().includes("cancel")
          ? "The passkey prompt was dismissed. Try again."
          : message,
      );
      setBusy(false);
      setPhase(null);
    }
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

        {unsupported ? (
          <p className="mt-6 rounded-btn border border-hair bg-bg px-4 py-3 text-[13.5px] text-amber" role="alert">
            {unsupported}
          </p>
        ) : (
          <>
            <Button onClick={signIn} disabled={busy} className="mt-6 w-full">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {phase ? PHASE_LABEL[phase] : "Signing in…"}
                </span>
              ) : (
                "Sign in with passkey"
              )}
            </Button>
            {error && (
              <p className="mt-3 text-[13px] text-amber" role="alert">
                {error}
              </p>
            )}
          </>
        )}
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
