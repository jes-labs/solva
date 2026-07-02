// Backend endpoints the /sandbox playground reaches through its server-side API
// routes. Point these at a local stack during a demo, or a hosted one later.
export const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? "http://localhost:8080";
export const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://localhost:8090";

// Bearer token for orchestrator /v1 calls. Set when hosted; omitted locally.
const ORCH_API_TOKEN = process.env.ORCH_API_TOKEN ?? "";

export function orchestratorHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (ORCH_API_TOKEN) headers.authorization = `Bearer ${ORCH_API_TOKEN}`;
  return headers;
}

// The mock bank's OAuth client and the accounts to read. These match the
// orchestrator's defaults (ORCH_BANK_CLIENT_ID, ORCH_BANK_ACCOUNTS).
export const BANK_CLIENT_ID = process.env.SANDBOX_CLIENT_ID ?? "solva-orchestrator";
export const BANK_ACCOUNTS = (process.env.SANDBOX_ACCOUNTS ?? "acct-anchor,acct-beacon,acct-cedar")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);
