import { STELLAR_DECIMALS, horizon, watchedAssets, type StellarAsset } from "@/config/assets";
import { formatAmount, parseAmount } from "./amount";

export type { StellarAsset };

export function wholeUnits(value: bigint): string {
  return formatAmount(value, STELLAR_DECIMALS).split(".")[0] ?? "0";
}

export function assetExplorerUrl(asset: StellarAsset): string {
  return horizon.asset(asset);
}

interface AssetSupply {
  asset: StellarAsset;
  supply: bigint;
  holders: number;
}

export interface SupplySnapshot {
  rows: readonly AssetSupply[];
  ledger: number;
  closedAt: string;
}

interface HorizonAssetRecord {
  balances?: { authorized?: string; authorized_to_maintain_liabilities?: string };
  claimable_balances_amount?: string;
  liquidity_pools_amount?: string;
  contracts_amount?: string;
  accounts?: { authorized?: number };
}

interface HorizonLedgerRecord {
  sequence?: number;
  closed_at?: string;
}

const TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 4000;

let cached: { at: number; snapshot: SupplySnapshot } | null = null;

function units(value: string | undefined): bigint {
  if (!value) return 0n;
  return parseAmount(value, STELLAR_DECIMALS) ?? 0n;
}

export function supplyFromRecord(record: HorizonAssetRecord): bigint {
  return (
    units(record.balances?.authorized) +
    units(record.balances?.authorized_to_maintain_liabilities) +
    units(record.claimable_balances_amount) +
    units(record.liquidity_pools_amount) +
    units(record.contracts_amount)
  );
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readAsset(asset: StellarAsset): Promise<AssetSupply | null> {
  const data = await getJson<{ _embedded?: { records?: HorizonAssetRecord[] } }>(
    `${horizon.url}/assets?asset_code=${asset.code}&asset_issuer=${asset.issuer}`,
  );
  const record = data?._embedded?.records?.[0];
  if (!record) return null;
  return {
    asset,
    supply: supplyFromRecord(record),
    holders: record.accounts?.authorized ?? 0,
  };
}

async function readLedger(): Promise<{ ledger: number; closedAt: string } | null> {
  const data = await getJson<{ _embedded?: { records?: HorizonLedgerRecord[] } }>(
    `${horizon.url}/ledgers?order=desc&limit=1`,
  );
  const record = data?._embedded?.records?.[0];
  if (!record?.sequence || !record.closed_at) return null;
  return { ledger: record.sequence, closedAt: record.closed_at };
}

export async function readSupplySnapshot(
  assets: readonly StellarAsset[] = watchedAssets,
): Promise<SupplySnapshot | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.snapshot;
  const [ledger, ...rows] = await Promise.all([readLedger(), ...assets.map(readAsset)]);
  const present = rows.filter((row): row is AssetSupply => row !== null);
  if (!ledger || present.length === 0) return null;
  const snapshot = { rows: present, ledger: ledger.ledger, closedAt: ledger.closedAt };
  cached = { at: Date.now(), snapshot };
  return snapshot;
}

export function formatClosedAt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}
