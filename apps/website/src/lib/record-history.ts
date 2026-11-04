import type { CoverageRecord, CoverageState } from "@/lib/coverage";
import { exampleRecords } from "@/lib/example-records";

export interface DayResult {
  date: string;
  state: CoverageState;
  owed: bigint;
  held: bigint;
  ledger: number | null;
}

export interface StateCount {
  covered: number;
  short: number;
  stale: number;
}

const DAY_MS = 86_400_000;
const LEDGERS_PER_DAY = 15_840;
const SUPPLY_GROWTH_PER_DAY = 31_250_000n;

interface HistoryPlan {
  latest: CoverageRecord;
  latestDate: string;
  days: number;
  shortDays: readonly number[];
  staleDays: readonly number[];
}

function shiftDate(isoDate: string, days: number): string {
  const time = Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS;
  return new Date(time).toISOString().slice(0, 10);
}

export function buildHistory(plan: HistoryPlan): DayResult[] {
  const { latest, latestDate, days, shortDays, staleDays } = plan;
  const results: DayResult[] = [];
  let lastProven: { owed: bigint; held: bigint } = { owed: latest.owed, held: latest.held };

  for (let index = 0; index < days; index += 1) {
    const back = days - 1 - index;
    const date = shiftDate(latestDate, -back);

    if (back === 0) {
      results.push({
        date,
        state: latest.state,
        owed: latest.owed,
        held: latest.held,
        ledger: latest.ledger,
      });
      continue;
    }

    const owed = latest.owed - BigInt(back) * SUPPLY_GROWTH_PER_DAY;
    const ledger = latest.ledger - back * LEDGERS_PER_DAY - ((index * 37) % 211);

    if (staleDays.includes(index)) {
      results.push({
        date,
        state: "stale",
        owed: lastProven.owed,
        held: lastProven.held,
        ledger: null,
      });
      continue;
    }

    const basisPoints = shortDays.includes(index)
      ? 9_940n
      : 10_200n + BigInt((index * 37) % 41) * 10n;
    const held = (owed * basisPoints) / 10_000n;
    const state: CoverageState = held >= owed ? "covered" : "short";
    lastProven = { owed, held };
    results.push({ date, state, owed, held, ledger });
  }

  return results;
}

export function countStates(days: readonly DayResult[]): StateCount {
  const count: StateCount = { covered: 0, short: 0, stale: 0 };
  for (const day of days) count[day.state] += 1;
  return count;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDay(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}

export function truncateAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
}

export function daysInMonth(days: readonly DayResult[], yearMonth: string): DayResult[] {
  return days.filter((day) => day.date.startsWith(`${yearMonth}-`));
}

export function proofDays(days: readonly DayResult[]): boolean[] {
  return days.map((day) => day.ledger !== null);
}

const kestrel = exampleRecords.find((record) => record.asset === "ARSK");

if (!kestrel) {
  throw new Error("The Kestrel Anchor example record is missing from example-records.");
}

export const kestrelRecord: CoverageRecord = kestrel;

export const KESTREL_ISSUER = "GKESTRLQ7VD2MNXW4HAJ5RCF3YTB6UPKZEZGSLXQOVN2WXHDMB547QXA";

const YEAR_DAYS = 365;
const HISTORY_DAYS = 90;
const HISTORY_START = YEAR_DAYS - HISTORY_DAYS;

export const kestrelYear: readonly DayResult[] = buildHistory({
  latest: kestrelRecord,
  latestDate: "2026-11-02",
  days: YEAR_DAYS,
  shortDays: [HISTORY_START + 52],
  staleDays: [HISTORY_START + 17, HISTORY_START + 18, HISTORY_START + 71],
});

export const kestrelHistory: readonly DayResult[] = kestrelYear.slice(-HISTORY_DAYS);
