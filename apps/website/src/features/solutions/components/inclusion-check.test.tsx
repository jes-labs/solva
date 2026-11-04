import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InclusionCheck } from "./inclusion-check";

describe("InclusionCheck", () => {
  it("shows the first example customer as counted", () => {
    render(<InclusionCheck />);
    expect(screen.getByText("Your balance was counted")).toBeInTheDocument();
    expect(screen.getByText("2,480.15 USDC")).toBeInTheDocument();
    expect(screen.getByText("18,420,905.12 USDC")).toBeInTheDocument();
  });

  it("checks another customer when picked", () => {
    render(<InclusionCheck />);
    fireEvent.click(screen.getByLabelText("NWC-2961"));
    expect(screen.getByText("487,331.20 USDC")).toBeInTheDocument();
  });

  it("reports a reference that is not in the proof", () => {
    render(<InclusionCheck />);
    fireEvent.change(screen.getByLabelText("Or enter an account reference"), {
      target: { value: "NWC-9999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("No balance found")).toBeInTheDocument();
  });

  it("asks for a valid reference", () => {
    render(<InclusionCheck />);
    fireEvent.change(screen.getByLabelText("Or enter an account reference"), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Check the reference")).toBeInTheDocument();
    expect(screen.getByLabelText("Or enter an account reference")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
