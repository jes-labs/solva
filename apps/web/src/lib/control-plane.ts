// Server-side client for the orchestrator control plane (#131). The admin token
// stays on the server and never reaches the browser.
const ORCH_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ?? "http://localhost:8080";

function headers(): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  const token = process.env.ORCH_API_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export interface CreatedTenant {
  id: string;
  name: string;
  plan: string;
}

// createTenant registers a new institution and returns it (no contract yet).
export async function createTenant(name: string, plan: string): Promise<CreatedTenant> {
  const res = await fetch(`${ORCH_URL}/v1/tenants`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, plan }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`create tenant: HTTP ${res.status}`);
  return res.json() as Promise<CreatedTenant>;
}

// setTenantWallet records the passkey smart-wallet account that owns the
// tenant's registry.
export async function setTenantWallet(tenantId: string, walletAddress: string): Promise<void> {
  const res = await fetch(`${ORCH_URL}/v1/tenants/${encodeURIComponent(tenantId)}/wallet`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ wallet_address: walletAddress }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`set tenant wallet: HTTP ${res.status}`);
}

// setTenantContract records the deployed registry, completing provisioning.
export async function setTenantContract(
  tenantId: string,
  contractId: string,
  network: string,
): Promise<void> {
  const res = await fetch(`${ORCH_URL}/v1/tenants/${encodeURIComponent(tenantId)}/contract`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ contract_id: contractId, network }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`set tenant contract: HTTP ${res.status}`);
}
