import { describe, expect, it } from "vitest";
import { coveragePercent } from "@/lib/amount";
import {
  buildHistory,
  countStates,
  daysInMonth,
  formatDay,
  kestrelHistory,
  kestrelRecord,
  kestrelYear,
  proofDays,
  truncateAddress,
} from "./record-history";

describe("kestrelYear", () => {
  it("holds a year of days whose last ninety are the history", () => {
    expect(kestrelYear).toHaveLength(365);
    expect(kestrelYear[0]?.date).toBe("2025-11-03");
    expect(kestrelYear.slice(-90)).toEqual(kestrelHistory);
  });

  it("has no short or stale day before the history begins", () => {
    expect(countStates(kestrelYear.slice(0, 275))).toEqual({ covered: 275, short: 0, stale: 0 });
  });
});

describe("proofDays", () => {
  it("marks a day true when a proof landed and false when it did not", () => {
    const days = proofDays(kestrelHistory);
    expect(days).toHaveLength(90);
    expect(days.filter((landed) => !landed)).toHaveLength(3);
    expect(days[17]).toBe(false);
    expect(days[89]).toBe(true);
  });
});

describe("kestrelHistory", () => {
  it("holds 90 consecutive days ending on the latest record", () => {
    expect(kestrelHistory).toHaveLength(90);
    expect(kestrelHistory[0]?.date).toBe("2026-08-05");
    const last = kestrelHistory[89];
    expect(last?.date).toBe("2026-11-02");
    expect(last?.owed).toBe(kestrelRecord.owed);
    expect(last?.held).toBe(kestrelRecord.held);
    expect(last?.ledger).toBe(kestrelRecord.ledger);
  });

  it("keeps one short day and three stale days", () => {
    expect(countStates(kestrelHistory)).toEqual({ covered: 86, short: 1, stale: 3 });
  });

  it("never rounds the short day up to covered", () => {
    const short = kestrelHistory.find((day) => day.state === "short");
    expect(short && coveragePercent(short.owed, short.held)).toBe("99.40%");
  });

  it("gives stale days no ledger and proven days rising ledgers", () => {
    const proven = kestrelHistory
      .filter((day) => day.ledger !== null)
      .map((day) => day.ledger ?? 0);
    expect(kestrelHistory.filter((day) => day.ledger === null)).toHaveLength(3);
    expect(proven.every((ledger, index) => index === 0 || ledger > (proven[index - 1] ?? 0))).toBe(
      true,
    );
  });
});

describe("buildHistory", () => {
  it("carries the last proven totals into a stale day", () => {
    const days = buildHistory({
      latest: kestrelRecord,
      latestDate: "2026-01-10",
      days: 3,
      shortDays: [],
      staleDays: [1],
    });
    expect(days[1]?.state).toBe("stale");
    expect(days[1]?.owed).toBe(days[0]?.owed);
    expect(days[1]?.held).toBe(days[0]?.held);
  });

  it("returns nothing for zero days", () => {
    expect(
      buildHistory({
        latest: kestrelRecord,
        latestDate: "2026-01-10",
        days: 0,
        shortDays: [],
        staleDays: [],
      }),
    ).toEqual([]);
  });
});

describe("formatDay", () => {
  it("writes the date in words", () => {
    expect(formatDay("2026-10-31")).toBe("31 October 2026");
  });
});

describe("truncateAddress", () => {
  it("keeps the first and last four characters", () => {
    expect(truncateAddress("GKESTRLQ7VD2MNXW4HAJ5RCF3YTB6UPKZEZGSLXQOVN2WXHDMB547QXA")).toBe(
      "GKES...7QXA",
    );
  });

  it("leaves short values alone", () => {
    expect(truncateAddress("GKES")).toBe("GKES");
  });
});

describe("daysInMonth", () => {
  it("returns every day of the month and nothing else", () => {
    const october = daysInMonth(kestrelHistory, "2026-10");
    expect(october).toHaveLength(31);
    expect(countStates(october)).toEqual({ covered: 30, short: 0, stale: 1 });
  });

  it("returns nothing for a month outside the history", () => {
    expect(daysInMonth(kestrelHistory, "2025-01")).toEqual([]);
  });
});
