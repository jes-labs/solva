import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { nextDayIndex, useDayPicker } from "./use-day-picker";

describe("nextDayIndex", () => {
  it("moves one day with the arrow keys and stops at the ends", () => {
    expect(nextDayIndex("ArrowRight", 3, 10)).toBe(4);
    expect(nextDayIndex("ArrowDown", 9, 10)).toBe(9);
    expect(nextDayIndex("ArrowLeft", 0, 10)).toBe(0);
    expect(nextDayIndex("ArrowUp", 5, 10)).toBe(4);
  });

  it("jumps to the first and last day", () => {
    expect(nextDayIndex("Home", 5, 10)).toBe(0);
    expect(nextDayIndex("End", 5, 10)).toBe(9);
  });

  it("ignores other keys and empty histories", () => {
    expect(nextDayIndex("a", 5, 10)).toBeNull();
    expect(nextDayIndex("End", 0, 0)).toBeNull();
  });
});

function Picker() {
  const { selected, register, handleKeyDown } = useDayPicker(3);
  return (
    <div>
      {[0, 1, 2].map((index) => (
        <button
          key={index}
          type="button"
          ref={register(index)}
          aria-pressed={index === selected}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          Day {index}
        </button>
      ))}
    </div>
  );
}

describe("useDayPicker", () => {
  it("selects the latest day first", () => {
    const { result } = renderHook(() => useDayPicker(90));
    expect(result.current.selected).toBe(89);
  });

  it("selects a day and refuses one outside the history", () => {
    const { result } = renderHook(() => useDayPicker(90));
    act(() => result.current.select(10));
    expect(result.current.selected).toBe(10);
    act(() => result.current.select(90));
    act(() => result.current.select(-1));
    expect(result.current.selected).toBe(10);
  });

  it("moves selection and focus with the keyboard", () => {
    render(<Picker />);
    const last = screen.getByRole("button", { name: "Day 2" });
    last.focus();
    fireEvent.keyDown(last, { key: "Home" });
    const first = screen.getByRole("button", { name: "Day 0" });
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(first, { key: "Enter" });
    expect(first).toHaveAttribute("aria-pressed", "true");
  });
});
