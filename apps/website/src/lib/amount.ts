const GROUPING = /\B(?=(\d{3})+(?!\d))/g;

export function formatAmount(baseUnits: bigint, decimals: number): string {
  const negative = baseUnits < 0n;
  const absolute = negative ? -baseUnits : baseUnits;
  const scale = 10n ** BigInt(decimals);
  const whole = (absolute / scale).toString().replace(GROUPING, ",");
  const sign = negative ? "-" : "";
  if (decimals === 0) return `${sign}${whole}`;
  const fraction = (absolute % scale).toString().padStart(decimals, "0");
  return `${sign}${whole}.${fraction}`;
}

export function parseAmount(input: string, decimals: number): bigint | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d*)?$/.test(cleaned)) return null;
  const [whole = "0", fraction = ""] = cleaned.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

export function coveragePercent(owed: bigint, held: bigint): string | null {
  if (owed <= 0n) return null;
  const basis = (held * 10000n) / owed;
  const whole = basis / 100n;
  const fraction = (basis % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}%`;
}
