import { NextResponse } from "next/server";
import { ORCHESTRATOR_URL } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

// GET /api/sandbox/status?tenant=<id> returns an institution's own contract and
// its latest published proof. Each institution resolves to its own contract, so
// the playground shows their proofs side by side, isolated (#126/#127/#130).
export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant");
  if (!tenant) {
    return NextResponse.json({ error: "tenant is required" }, { status: 400 });
  }
  try {
    const [contract, proof] = await Promise.all([
      fetchJSON(`${ORCHESTRATOR_URL}/v1/tenants/${encodeURIComponent(tenant)}/contract`),
      fetchJSON(`${ORCHESTRATOR_URL}/v1/proofs/latest?tenant_id=${encodeURIComponent(tenant)}`),
    ]);
    return NextResponse.json({ contract, proof });
  } catch (err) {
    return NextResponse.json(
      { error: `backend unreachable: ${String(err)}` },
      { status: 502 },
    );
  }
}

// fetchJSON returns the parsed body on 2xx, or null otherwise (an unprovisioned
// tenant or a registry with no proof yet is a normal, non-error state here).
async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}
