import type { CoverageState } from "@/lib/coverage";
import { stateLabel } from "@/lib/coverage";

const ORDER: readonly CoverageState[] = ["covered", "short", "stale"];

export function dailyHistory(
  days: number,
  exceptions: Readonly<Record<number, CoverageState>>,
): CoverageState[] {
  if (!Number.isInteger(days) || days < 0) return [];
  return Array.from({ length: days }, (_, day) => exceptions[day] ?? "covered");
}

export function summarizeDays(days: readonly CoverageState[]): string {
  if (days.length === 0) return "No results yet";
  return ORDER.map((state) => ({ state, count: days.filter((day) => day === state).length }))
    .filter(({ count }) => count > 0)
    .map(({ state, count }) => `${count} ${stateLabel[state].toLowerCase()}`)
    .join(", ");
}
