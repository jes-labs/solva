import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entry, installIntersectionObserver } from "./io-mock";
import { useActiveSection } from "./use-active-section";

const IDS = ["first", "second", "third"] as const;

function Contents({ ids }: { ids: readonly string[] }) {
  const activeId = useActiveSection(ids);
  return (
    <>
      {IDS.map((id) => (
        <section key={id} id={id} />
      ))}
      <p data-testid="active">{activeId}</p>
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useActiveSection", () => {
  it("starts on the first section", () => {
    installIntersectionObserver();
    render(<Contents ids={IDS} />);
    expect(screen.getByTestId("active")).toHaveTextContent("first");
  });

  it("follows the topmost section in the reading band", () => {
    const handles = installIntersectionObserver();
    const { container } = render(<Contents ids={IDS} />);
    const [, second, third] = Array.from(container.querySelectorAll("section"));
    if (!second || !third) throw new Error("missing sections");
    act(() => handles[0]?.callback([entry(third, true, 400), entry(second, true, 120)]));
    expect(screen.getByTestId("active")).toHaveTextContent("second");
    expect(handles[0]?.observed).toHaveLength(3);
  });

  it("ignores sections leaving the band", () => {
    const handles = installIntersectionObserver();
    const { container } = render(<Contents ids={IDS} />);
    const first = container.querySelector("section");
    if (!first) throw new Error("missing section");
    act(() => handles[0]?.callback([entry(first, false)]));
    expect(screen.getByTestId("active")).toHaveTextContent("first");
  });

  it("does nothing when no section with those ids exists", () => {
    const handles = installIntersectionObserver();
    render(<Contents ids={["missing"]} />);
    expect(handles).toHaveLength(0);
    expect(screen.getByTestId("active")).toHaveTextContent("missing");
  });
});
