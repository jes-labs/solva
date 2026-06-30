import { NextResponse } from "next/server";
import { ORCHESTRATOR_URL } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

// GET /api/sandbox/inclusion?tenant=<id>&id_hash=<hex> resolves a customer's
// inclusion path in the institution's latest proof. The path is what the
// contract's verify_inclusion recomputes the root from, so a customer can prove
// their balance is committed without seeing anyone else's.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tenant = params.get("tenant");
  const idHash = params.get("id_hash");
  if (!tenant || !idHash) {
    return NextResponse.json({ error: "tenant and id_hash are required" }, { status: 400 });
  }

  try {
    const latest = await fetch(
      `${ORCHESTRATOR_URL}/v1/proofs/latest?tenant_id=${encodeURIComponent(tenant)}`,
    );
    if (!latest.ok) {
      return NextResponse.json({ error: "no proof to check against yet" }, { status: 404 });
    }
    const proof = (await latest.json()) as { id?: string };
    if (!proof.id) {
      return NextResponse.json({ error: "no proof to check against yet" }, { status: 404 });
    }

    const ref = `${proof.id}:${idHash}`;
    const inc = await fetch(
      `${ORCHESTRATOR_URL}/v1/proofs/inclusion/${encodeURIComponent(ref)}`,
    );
    if (inc.status === 404) {
      return NextResponse.json({ included: false, reason: "customer not in this proof" });
    }
    if (!inc.ok) {
      return NextResponse.json({ error: "inclusion lookup failed" }, { status: 502 });
    }
    const data = (await inc.json()) as {
      proof_id?: string;
      customer_id_hash?: string;
      balance?: string;
      root_hash?: string;
      path?: unknown[];
    };
    return NextResponse.json({
      included: true,
      chainProofId: data.proof_id,
      customerIdHash: data.customer_id_hash,
      balance: data.balance,
      rootHash: data.root_hash,
      pathLength: Array.isArray(data.path) ? data.path.length : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: `backend unreachable: ${String(err)}` }, { status: 502 });
  }
}
