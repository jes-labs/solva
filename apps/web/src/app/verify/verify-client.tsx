"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@solva/ui";
import { verifyProofClientSide } from "@/lib/noir";

// Public verify surface. Anyone pastes a proof id, the app reads the published
// totals and timestamp, and optionally re-checks the proof in the browser.
// Wired to local state and the noir_js stub; a fuller build fetches the proof
// through the SDK.

interface ProofView {
  id: string;
  reservesTotal: string;
  liabilitiesTotal: string;
  publishedAt: string;
}

export function VerifyClient() {
  const [proofId, setProofId] = useState("");
  const [view, setView] = useState<ProofView | null>(null);
  const [clientCheck, setClientCheck] = useState<string | null>(null);

  function lookUp() {
    if (!proofId.trim()) return;
    // Real: const proof = await solva.getProof(proofId).
    setView({
      id: proofId.trim(),
      reservesTotal: "12,400,000",
      liabilitiesTotal: "11,980,000",
      publishedAt: "2 minutes ago",
    });
    setClientCheck(null);
  }

  async function runClientCheck() {
    const result = await verifyProofClientSide({
      id: proofId,
      proof: "",
      publicInputs: {
        reservesTotal: "0",
        liabilitiesTotal: "0",
        rootHash: "0x",
        prevReserves: "0",
      },
      publishedAt: 0,
    });
    setClientCheck(
      result.verified ? "Verified in your browser." : (result.unavailableReason ?? "Unavailable."),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify a proof</CardTitle>
          <CardDescription>
            Paste a proof id to see the published totals and when they were verified on Stellar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <input
            value={proofId}
            onChange={(e) => setProofId(e.target.value)}
            placeholder="Proof id"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={lookUp}>Look up</Button>
        </CardContent>
      </Card>

      {view && (
        <Card>
          <CardHeader>
            <CardTitle>Proof {view.id}</CardTitle>
            <CardDescription>Verified on Stellar, {view.publishedAt}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Reserves: {view.reservesTotal}</p>
            <p>Liabilities: {view.liabilitiesTotal}</p>
            <Button variant="outline" onClick={runClientCheck}>
              Verify in my browser
            </Button>
            {clientCheck && <p className="text-muted-foreground">{clientCheck}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
