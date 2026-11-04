export function reserveBalanceUrl(base: string, account: string): string {
  return `${base.replace(/\/+$/, "")}/v1/accounts/${encodeURIComponent(account)}/balance`;
}
