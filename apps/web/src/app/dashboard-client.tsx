"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusPill,
  type StatusTone,
} from "@solva/ui";
import { authProvider } from "@/lib/auth";

// Institution dashboard. This is the client shell: passkey sign-in, connect a
// source, trigger a cycle, and show live status. Data calls go through the SDK
// on the server in a fuller build; here the actions are wired to the auth stub
// and local state so the surface is real and navigable.

type CycleState = "idle" | "running" | "done";

export function DashboardClient() {
  const [operator, setOperator] = useState<string | null>(null);
  const [cycle, setCycle] = useState<CycleState>("idle");
  const [sources, setSources] = useState<string[]>([]);

  async function signIn() {
    const session = await authProvider.signIn();
    setOperator(session.label);
  }

  function connectSource() {
    // A real connect opens the source config drawer and calls
    // solva.connectSource. Here we append a placeholder source.
    setSources((prev) => [...prev, `Bank ${prev.length + 1}`]);
  }

  async function runCycle() {
    setCycle("running");
    // Real: const id = await solva.runProofCycle();
    await new Promise((r) => setTimeout(r, 600));
    setCycle("done");
  }

  if (!operator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your passkey. No seed phrase. We provision a smart wallet for your institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn}>Sign in with passkey</Button>
        </CardContent>
      </Card>
    );
  }

  const status: { tone: StatusTone; label: string } =
    cycle === "done"
      ? { tone: "solvent", label: "Solvent, verified on Stellar" }
      : { tone: "unknown", label: "No proof yet" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {operator}</p>
        </div>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reserve sources</CardTitle>
          <CardDescription>Connect the banks and wallets that back your reserves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm">
            {sources.length === 0 ? (
              <li className="text-muted-foreground">No sources connected yet.</li>
            ) : (
              sources.map((s) => <li key={s}>{s}</li>)
            )}
          </ul>
          <Button variant="outline" onClick={connectSource}>
            Connect a source
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof cycle</CardTitle>
          <CardDescription>
            Run a cycle to attest reserves, commit liabilities, and publish a proof on-chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button onClick={runCycle} disabled={cycle === "running"}>
            {cycle === "running" ? "Running..." : "Run proof cycle"}
          </Button>
          {cycle === "done" && (
            <span className="text-sm text-muted-foreground">Latest proof published.</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Every cycle is appended here. Export for your records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {cycle === "done" ? "1 proof in the log." : "The log is empty."}
          </p>
          <Button variant="ghost" disabled={cycle !== "done"}>
            Export report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
