import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { explorer, verifierEvidence } from "@/config/evidence";
import { Steps } from "./steps";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let fire: Callback = () => undefined;

class FakeObserver {
  constructor(callback: Callback) {
    fire = callback;
  }
  observe = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Steps", () => {
  it("lists the five steps in order, in the gutter and on the page", () => {
    render(<Steps />);
    const gutter = screen.getByRole("complementary", { name: "Where you are in the five steps" });
    const names = within(gutter)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(names).toEqual(["Balances", "Commit", "Proof", "Verify", "Record"]);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(names);
  });

  it("marks the step in the middle of the screen as current", () => {
    render(<Steps />);
    const gutter = screen.getByRole("complementary", { name: "Where you are in the five steps" });
    expect(within(gutter).getByRole("link", { name: "Balances" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    act(() =>
      fire([{ isIntersecting: true, target: document.getElementById("step-verify") ?? undefined }]),
    );
    expect(within(gutter).getByRole("link", { name: "Verify" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(gutter).getByRole("link", { name: "Balances" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("links the verifier contract and the verified transaction to the explorer", () => {
    render(<Steps />);
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toContain(explorer.contract(verifierEvidence.contractId));
    expect(links).toContain(explorer.tx(verifierEvidence.verifyTx));
  });
});
