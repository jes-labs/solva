import { NextResponse } from "next/server";
import { ORCHESTRATOR_URL, orchestratorHeaders, unreachable } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: orchestratorHeaders() });
  return res.ok ? res.json() : null;
}

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
  } catch (error) {
    return NextResponse.json(unreachable(error), { status: 502 });
  }
}
