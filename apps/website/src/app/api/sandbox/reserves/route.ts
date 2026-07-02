import { NextResponse } from "next/server";
import { SANDBOX_URL, BANK_CLIENT_ID, BANK_ACCOUNTS } from "@/lib/sandbox-backend";

export const dynamic = "force-dynamic";

interface SignedBalance {
  source_id: string;
  balance: string;
  currency: string;
  as_of: string;
  signature: string;
}

// GET /api/sandbox/reserves fetches a fresh token, then each account's signed
// balance from the mock bank. Each balance carries an ECDSA signature over a
// canonical payload, which the orchestrator verifies; the playground shows the
// real signatures so "fetch reserves" is the genuine signed read.
export async function GET() {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "could not obtain a bank token" }, { status: 502 });
    }

    const balances: SignedBalance[] = [];
    for (const account of BANK_ACCOUNTS) {
      const res = await fetch(
        `${SANDBOX_URL}/accounts/${encodeURIComponent(account)}/balance`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      if (res.ok) balances.push((await res.json()) as SignedBalance);
    }

    const total = balances
      .reduce((sum, b) => sum + BigInt(b.balance || "0"), 0n)
      .toString();

    return NextResponse.json({ balances, total });
  } catch (err) {
    return NextResponse.json({ error: `backend unreachable: ${String(err)}` }, { status: 502 });
  }
}

async function getToken(): Promise<string | null> {
  const authRes = await fetch(
    `${SANDBOX_URL}/oauth/authorize?client_id=${encodeURIComponent(BANK_CLIENT_ID)}`,
  );
  if (!authRes.ok) return null;
  const { code } = (await authRes.json()) as { code: string };
  const tokenRes = await fetch(`${SANDBOX_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code }).toString(),
  });
  if (!tokenRes.ok) return null;
  const token = (await tokenRes.json()) as { access_token: string };
  return token.access_token;
}
