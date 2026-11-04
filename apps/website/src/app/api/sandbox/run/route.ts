import { NextResponse } from "next/server";
import {
  ORCHESTRATOR_URL,
  SANDBOX_URL,
  orchestratorHeaders,
  unreachable,
} from "@/lib/sandbox-backend";
import { demoInstitution } from "@/lib/demo-institutions";

export const dynamic = "force-dynamic";

function cycleError(status: number, detail: string): string {
  let reason = "the proof cycle could not complete";
  try {
    const parsed = JSON.parse(detail) as { error?: string };
    if (parsed.error) reason = parsed.error;
  } catch {
    reason = detail.trim() || reason;
  }
  return `Cycle failed (HTTP ${status}): ${reason}`;
}

async function fetchProof(tenantId: string): Promise<unknown> {
  const res = await fetch(
    `${ORCHESTRATOR_URL}/v1/proofs/latest?tenant_id=${encodeURIComponent(tenantId)}`,
    { headers: orchestratorHeaders() },
  );
  return res.ok ? res.json() : null;
}

export async function POST(request: Request) {
  let body: { tenantId?: string; scenario?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { tenantId, scenario } = body;
  const institution = tenantId ? demoInstitution(tenantId) : undefined;
  if (!tenantId || !institution) {
    return NextResponse.json({ error: "a known tenantId is required" }, { status: 400 });
  }
  const attested = institution.reserves.kind === "attested";
  if (attested && !scenario) {
    return NextResponse.json({ error: "scenario is required" }, { status: 400 });
  }

  try {
    if (attested && scenario) {
      const seeded = await fetch(`${SANDBOX_URL}/admin/scenarios/${encodeURIComponent(scenario)}`, {
        method: "POST",
      });
      if (!seeded.ok) {
        return NextResponse.json(
          { error: `sandbox rejected scenario ${scenario}` },
          { status: 502 },
        );
      }
    }

    const cycle = await fetch(`${ORCHESTRATOR_URL}/v1/cycles`, {
      method: "POST",
      headers: orchestratorHeaders({
        "content-type": "application/json",
        "Idempotency-Key": `website-${scenario ?? "onchain"}-${Date.now()}`,
      }),
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (cycle.status === 409) {
      return NextResponse.json({ published: false, busy: true });
    }
    if (cycle.status === 422) {
      return NextResponse.json({ published: false, rejected: true });
    }
    if (cycle.status < 200 || cycle.status >= 300) {
      const detail = await cycle.text().catch(() => "");
      return NextResponse.json({ published: false, error: cycleError(cycle.status, detail) });
    }

    const proof = await fetchProof(tenantId);
    return NextResponse.json({ published: true, proof });
  } catch (error) {
    return NextResponse.json(unreachable(error), { status: 502 });
  }
}
