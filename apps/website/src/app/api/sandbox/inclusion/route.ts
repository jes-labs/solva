import { NextResponse } from "next/server";
import { demoInstitution } from "@/lib/demo-institutions";
import { checkInclusionOnChain } from "@/lib/onchain-record";
import { ORCHESTRATOR_URL, orchestratorHeaders, unreachable } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tenant = params.get("tenant");
  const idHash = params.get("id_hash");
  if (!tenant || !idHash || !demoInstitution(tenant)) {
    return NextResponse.json({ error: "a known tenant and id_hash are required" }, { status: 400 });
  }

  try {
    const latest = await fetch(
      `${ORCHESTRATOR_URL}/v1/proofs/latest?tenant_id=${encodeURIComponent(tenant)}`,
      { headers: orchestratorHeaders() },
    );
    if (!latest.ok) {
      return NextResponse.json({ error: "no proof to check against yet" }, { status: 404 });
    }
    const proof = (await latest.json()) as { id?: string };
    if (!proof.id) {
      return NextResponse.json({ error: "no proof to check against yet" }, { status: 404 });
    }

    const ref = `${proof.id}:${idHash}`;
    const inclusion = await fetch(
      `${ORCHESTRATOR_URL}/v1/proofs/inclusion/${encodeURIComponent(ref)}`,
      { headers: orchestratorHeaders() },
    );
    if (inclusion.status === 404) {
      return NextResponse.json({ included: false, reason: "holder not in this proof" });
    }
    if (!inclusion.ok) {
      return NextResponse.json({ error: "inclusion lookup failed" }, { status: 502 });
    }
    const data = (await inclusion.json()) as {
      proof_id?: string;
      customer_id_hash?: string;
      balance?: string;
      root_hash?: string;
      path?: unknown[];
    };
    const onChain = await checkInclusionOnChain(tenant, ref);
    return NextResponse.json({
      included: true,
      onChain,
      chainProofId: data.proof_id,
      customerIdHash: data.customer_id_hash,
      balance: data.balance,
      rootHash: data.root_hash,
      pathLength: Array.isArray(data.path) ? data.path.length : 0,
    });
  } catch (error) {
    return NextResponse.json(unreachable(error), { status: 502 });
  }
}
