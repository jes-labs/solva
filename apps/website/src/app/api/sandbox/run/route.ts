import { NextResponse } from "next/server";

// Server-side proxy for the sandbox playground. The browser talks to this
// same-origin route; the route reaches the Solva backend, so there is no CORS
// dance and the backend URLs stay server-side. Point these at a local stack
// during a demo, or a hosted one once the prover image lands (#135).
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? "http://localhost:8080";
const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://localhost:8090";

export const dynamic = "force-dynamic";

// POST /api/sandbox/run { tenantId, scenario } runs one real proof cycle for an
// institution: point the mock bank at the scenario, then trigger the
// orchestrator (which fetches signed reserves, proves, and publishes on-chain).
// The insolvent scenario is expected to be rejected, which is the point: the
// system will not prove a lie.
export async function POST(request: Request) {
  let body: { tenantId?: string; scenario?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { tenantId, scenario } = body;
  if (!tenantId || !scenario) {
    return NextResponse.json(
      { error: "tenantId and scenario are required" },
      { status: 400 },
    );
  }

  try {
    // 1. Point the mock open-banking sandbox at the chosen scenario.
    const seeded = await fetch(
      `${SANDBOX_URL}/admin/scenarios/${encodeURIComponent(scenario)}`,
      { method: "POST" },
    );
    if (!seeded.ok) {
      return NextResponse.json(
        { error: `sandbox rejected scenario ${scenario}` },
        { status: 502 },
      );
    }

    // 2. Run the full cycle. The orchestrator endpoint is synchronous: it
    // returns once the proof is published (or the cycle is rejected).
    const cycle = await fetch(`${ORCHESTRATOR_URL}/v1/cycles`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": `playground-${scenario}-${Date.now()}`,
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (cycle.status < 200 || cycle.status >= 300) {
      // A non-2xx is an expected outcome for insolvent: the proof could not be
      // generated because reserves are below liabilities.
      const detail = await cycle.text().catch(() => "");
      return NextResponse.json({ published: false, rejected: true, detail });
    }

    const proof = await fetchProof(tenantId);
    return NextResponse.json({ published: true, proof });
  } catch (err) {
    return NextResponse.json(
      { error: `backend unreachable: ${String(err)}` },
      { status: 502 },
    );
  }
}

async function fetchProof(tenantId: string): Promise<unknown> {
  const res = await fetch(
    `${ORCHESTRATOR_URL}/v1/proofs/latest?tenant_id=${encodeURIComponent(tenantId)}`,
  );
  return res.ok ? res.json() : null;
}
