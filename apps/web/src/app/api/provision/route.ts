import { NextResponse } from "next/server";

import { createTenant, setTenantWallet, setTenantContract } from "@/lib/control-plane";

export const dynamic = "force-dynamic";

// POST /api/provision { name, plan, wallet } creates the tenant and records its
// passkey wallet, then returns the tenant id and the command to deploy the
// registry owned by that wallet. Deploy stays an explicit operator step (#131).
export async function POST(request: Request) {
  let body: { name?: string; plan?: string; wallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { name, plan, wallet } = body;
  if (!name || !wallet) {
    return NextResponse.json({ error: "name and wallet are required" }, { status: 400 });
  }
  try {
    const tenant = await createTenant(name, plan ?? "free");
    await setTenantWallet(tenant.id, wallet);
    const deployCommand = `just provision-tenant ${tenant.id} ${wallet} testnet signor`;
    return NextResponse.json({ tenantId: tenant.id, deployCommand });
  } catch (err) {
    return NextResponse.json({ error: `provisioning failed: ${String(err)}` }, { status: 502 });
  }
}

// PUT /api/provision { tenantId, contractId, network } records the deployed
// registry, completing provisioning.
export async function PUT(request: Request) {
  let body: { tenantId?: string; contractId?: string; network?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { tenantId, contractId, network } = body;
  if (!tenantId || !contractId) {
    return NextResponse.json({ error: "tenantId and contractId are required" }, { status: 400 });
  }
  try {
    await setTenantContract(tenantId, contractId, network ?? "testnet");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `recording registry failed: ${String(err)}` }, { status: 502 });
  }
}
