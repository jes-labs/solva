import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveStep } from "./use-active-step";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let fire: Callback = () => undefined;
const observe = vi.fn();
const disconnect = vi.fn();

class FakeObserver {
  constructor(callback: Callback) {
    fire = callback;
  }
  observe = observe;
  disconnect = disconnect;
}

function stepNode(index: number | string): HTMLElement {
  const node = document.createElement("div");
  node.dataset.step = String(index);
  return node;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  observe.mockClear();
  disconnect.mockClear();
});

describe("useActiveStep", () => {
  it("starts on the first step", () => {
    const { result } = renderHook(() => useActiveStep(4));
    expect(result.current.active).toBe(0);
    expect(result.current.isTracking).toBe(true);
  });

  it("observes registered steps and follows the one in the middle of the screen", () => {
    const nodes = [0, 1, 2].map(stepNode);
    const { result, rerender } = renderHook(({ count }) => useActiveStep(count), {
      initialProps: { count: 3 },
    });
    nodes.forEach((node, index) => result.current.register(index)(node));
    rerender({ count: 4 });
    expect(observe).toHaveBeenCalledTimes(3);
    act(() => fire([{ isIntersecting: true, target: nodes[2] }]));
    expect(result.current.active).toBe(2);
  });

  it("ignores steps leaving the screen and indexes it does not know", () => {
    const { result } = renderHook(() => useActiveStep(3));
    act(() => fire([{ isIntersecting: false, target: stepNode(2) }]));
    act(() => fire([{ isIntersecting: true, target: stepNode(9) }]));
    act(() => fire([{ isIntersecting: true, target: stepNode("x") }]));
    expect(result.current.active).toBe(0);
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() => useActiveStep(3));
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("stays on the first step where the browser has no observer", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { result } = renderHook(() => useActiveStep(3));
    expect(result.current.active).toBe(0);
    expect(result.current.isTracking).toBe(false);
  });
});
