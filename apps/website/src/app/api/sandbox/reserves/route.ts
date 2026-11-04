import { NextResponse } from "next/server";
import {
  RESERVE_ACCOUNTS,
  SANDBOX_URL,
  reserveSourceToken,
  unreachable,
} from "@/lib/sandbox-backend";
import { demoInstitution } from "@/lib/demo-institutions";
import { readHolding } from "@/lib/horizon-reserves";
import { reserveBalanceUrl } from "@/lib/sandbox-paths";

export const dynamic = "force-dynamic";

interface SignedBalance {
  source_id: string;
  balance: string;
  currency: string;
  as_of: string;
  signature: string;
}

export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "";
  const institution = demoInstitution(tenant);
  if (!institution) {
    return NextResponse.json({ error: "unknown institution" }, { status: 400 });
  }
  if (institution.reserves.kind === "onchain") {
    try {
      const balance = await readHolding(institution.reserves);
      return NextResponse.json({ onchain: true, total: balance });
    } catch (error) {
      return NextResponse.json(
        { error: `could not read the reserve account: ${String(error)}` },
        { status: 502 },
      );
    }
  }

  try {
    const token = await reserveSourceToken();
    if (!token) {
      return NextResponse.json(
        { error: "could not obtain a reserve-source token" },
        { status: 502 },
      );
    }

    const balances: SignedBalance[] = [];
    for (const account of RESERVE_ACCOUNTS) {
      const res = await fetch(reserveBalanceUrl(SANDBOX_URL, account), {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `could not read the signed balance of ${account} (HTTP ${res.status})` },
          { status: 502 },
        );
      }
      balances.push((await res.json()) as SignedBalance);
    }

    const total = balances.reduce((sum, item) => sum + BigInt(item.balance || "0"), 0n).toString();
    return NextResponse.json({ balances, total });
  } catch (error) {
    return NextResponse.json(unreachable(error), { status: 502 });
  }
}
