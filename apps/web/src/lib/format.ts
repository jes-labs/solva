// Formatting helpers for on-chain values. Amounts and hashes arrive as strings
// (never numbers) so we keep full precision; math uses BigInt.

// Group an integer decimal string with thousands separators.
export function formatAmount(value: string): string {
  const negative = value.startsWith("-");
  const digits = (negative ? value.slice(1) : value).replace(/\D/g, "") || "0";
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return negative ? `-${grouped}` : grouped;
}

// Margin of reserves over liabilities, in basis points. 350 means R is 3.5%
// above L. Returns 0 when liabilities are zero or the inputs do not parse.
export function marginBps(reserves: string, liabilities: string): number {
  try {
    const r = BigInt(reserves);
    const l = BigInt(liabilities);
    if (l <= 0n) return 0;
    return Number(((r - l) * 10000n) / l);
  } catch {
    return 0;
  }
}

// Basis points rendered as a percentage, for example 350 -> "3.5%".
export function formatBpsPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

// Coarse relative time, "just now" through "N days ago".
export function formatRelativeTime(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 45) return "just now";
  if (diff < 90) return "a minute ago";
  const minutes = Math.round(diff / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(diff / 3600);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(diff / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Absolute UTC timestamp, for example "Jun 20, 2026, 11:54 UTC".
export function formatTimestamp(unixSeconds: number): string {
  const formatted = new Date(unixSeconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${formatted} UTC`;
}

// Shorten a long hash or id for display, keeping both ends.
export function truncateMiddle(value: string, head = 10, tail = 8): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
