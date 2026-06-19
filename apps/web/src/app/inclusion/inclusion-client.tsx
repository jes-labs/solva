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
} from "@solva/ui";

// Customer inclusion checker. The customer enters their reference, the app
// resolves the inclusion ref through the orchestrator and calls verify_inclusion
// on-chain. Wired to local state here; a fuller build calls
// solva.verifyInclusion(reference).

type Result = "none" | "checking" | "included" | "missing";

export function InclusionClient() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Result>("none");

  async function check() {
    if (!reference.trim()) return;
    setResult("checking");
    // Real: const { included } = await solva.verifyInclusion(reference).
    await new Promise((r) => setTimeout(r, 600));
    setResult("included");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check that your balance is included</CardTitle>
        <CardDescription>
          Enter the reference your institution gave you. We check it against the proof on Stellar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Your reference"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={check} disabled={result === "checking"}>
            {result === "checking" ? "Checking..." : "Check"}
          </Button>
        </div>

        {result === "included" && (
          <StatusPill tone="solvent" label="Your balance is included in the latest proof" />
        )}
        {result === "missing" && (
          <StatusPill tone="breach" label="Not found. Contact your institution." />
        )}
      </CardContent>
    </Card>
  );
}
