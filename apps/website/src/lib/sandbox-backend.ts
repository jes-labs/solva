import "server-only";

export const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? "http://localhost:8080";
export const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://localhost:8090";

const ORCH_API_TOKEN = process.env.ORCH_API_TOKEN ?? "";

export function orchestratorHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (ORCH_API_TOKEN) headers.authorization = `Bearer ${ORCH_API_TOKEN}`;
  return headers;
}

export const RESERVE_CLIENT_ID = process.env.SANDBOX_CLIENT_ID ?? "solva-orchestrator";
export const RESERVE_ACCOUNTS = (
  process.env.SANDBOX_ACCOUNTS ?? "acct-anchor,acct-beacon,acct-cedar"
)
  .split(",")
  .map((account) => account.trim())
  .filter(Boolean);

export async function reserveSourceToken(): Promise<string | null> {
  const authorize = await fetch(
    `${SANDBOX_URL}/oauth/authorize?client_id=${encodeURIComponent(RESERVE_CLIENT_ID)}`,
  );
  if (!authorize.ok) return null;
  const { code } = (await authorize.json()) as { code: string };
  const token = await fetch(`${SANDBOX_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code }).toString(),
  });
  if (!token.ok) return null;
  const body = (await token.json()) as { access_token: string };
  return body.access_token;
}

export function unreachable(error: unknown) {
  return { error: `backend unreachable: ${String(error)}` };
}
