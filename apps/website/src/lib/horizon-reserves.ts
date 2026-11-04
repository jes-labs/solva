import "server-only";
import { holdingBalance, type ReserveSource } from "./demo-institutions";

const HORIZON_URL = process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";

type OnChainSource = Extract<ReserveSource, { kind: "onchain" }>;

export async function readHolding(source: OnChainSource): Promise<string> {
  const res = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(source.account)}`);
  if (!res.ok) throw new Error(`Horizon returned HTTP ${res.status} for the reserve account`);
  const balance = holdingBalance(await res.json(), source.code, source.issuer);
  if (balance === null) throw new Error(`the reserve account holds no ${source.code}`);
  return balance;
}
