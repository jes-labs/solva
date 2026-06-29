import { NextResponse } from "next/server";

import { institutionLatestProof, isUnknownInstitution } from "@/lib/proof-registry";

// A live read against the institution's deployed proof-registry, so never
// statically cached.
export const dynamic = "force-dynamic";

// GET /api/latest-proof?institution=<id> returns that institution's latest
// on-chain proof, read from its own contract (#129). Cases:
//   - no institution param       -> 400
//   - unknown/unprovisioned org  -> 404
//   - provisioned org, no proof  -> { proof: null } (a fresh registry)
//   - otherwise                  -> { proof }
export async function GET(request: Request) {
  const institution = new URL(request.url).searchParams.get("institution");
  if (!institution) {
    return NextResponse.json(
      { error: "institution query parameter is required" },
      { status: 400 },
    );
  }
  try {
    const proof = await institutionLatestProof(institution);
    return NextResponse.json({ proof });
  } catch (err) {
    if (isUnknownInstitution(err)) {
      return NextResponse.json({ error: "unknown institution" }, { status: 404 });
    }
    // Provisioned institution with no proof yet, or a transient read failure.
    return NextResponse.json({ proof: null, note: String(err) });
  }
}
