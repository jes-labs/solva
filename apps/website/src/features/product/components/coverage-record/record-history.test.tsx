import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecordHistory } from "./record-history";

describe("RecordHistory", () => {
  it("shows the latest day first", () => {
    render(<RecordHistory />);
    expect(screen.getByRole("button", { name: "2 November 2026, Covered" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText("Reserves were at least what was owed at this ledger."),
    ).toBeInTheDocument();
  });

  it("shows the gap on the short day", () => {
    render(<RecordHistory />);
    fireEvent.click(screen.getByRole("button", { name: "26 September 2026, Short" }));
    expect(screen.getByText(/Reserves were short by .* ARSK at this ledger\./)).toBeInTheDocument();
    expect(screen.getByText("99.40%")).toBeInTheDocument();
  });

  it("treats a stale day as unknown and shows no ledger", () => {
    render(<RecordHistory />);
    fireEvent.click(screen.getByRole("button", { name: "15 October 2026, Stale" }));
    expect(screen.getByText(/Treat coverage as unknown/)).toBeInTheDocument();
    expect(screen.getByText("Last known")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("moves between days with the arrow keys", () => {
    render(<RecordHistory />);
    const latest = screen.getByRole("button", { name: "2 November 2026, Covered" });
    latest.focus();
    fireEvent.keyDown(latest, { key: "ArrowLeft" });
    const previous = screen.getByRole("button", { name: "1 November 2026, Covered" });
    expect(previous).toHaveFocus();
    expect(previous).toHaveAttribute("tabindex", "0");
    expect(latest).toHaveAttribute("tabindex", "-1");
  });
});
