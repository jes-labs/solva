import { NextResponse } from "next/server";

import { proofRegistryClient } from "@/lib/proof-registry";

// A live read against the deployed proof-registry contract, so never statically
// cached.
export const dynamic = "force-dynamic";

// GET /api/latest-proof returns the latest on-chain proof. A fresh deployment
// has no proof yet, which the contract reports as an error; that is still a
// successful round-trip, so it is surfaced as { proof: null } with a note.
export async function GET() {
  try {
    const proof = await proofRegistryClient().getLatestProof();
    return NextResponse.json({ proof });
  } catch (err) {
    return NextResponse.json({ proof: null, note: String(err) });
  }
}
