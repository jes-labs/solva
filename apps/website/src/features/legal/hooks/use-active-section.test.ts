import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveSection } from "./use-active-section";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let callback: Callback = () => undefined;
const observe = vi.fn();
const disconnect = vi.fn();

class FakeObserver {
  constructor(next: Callback) {
    callback = next;
  }
  observe = observe;
  disconnect = disconnect;
}

function entry(id: string, isIntersecting: boolean): Partial<IntersectionObserverEntry> {
  const target = document.getElementById(id);
  if (!target) {
    throw new Error(`missing ${id}`);
  }
  return { target, isIntersecting, boundingClientRect: target.getBoundingClientRect() };
}

beforeEach(() => {
  document.body.innerHTML = '<section id="terms"></section><section id="privacy"></section>';
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  observe.mockClear();
  disconnect.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("useActiveSection", () => {
  it("starts on the first section and observes every one", () => {
    const { result } = renderHook(() => useActiveSection(["terms", "privacy"]));
    expect(result.current).toBe("terms");
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it("follows the first section in view", () => {
    const { result } = renderHook(() => useActiveSection(["terms", "privacy"]));
    act(() => callback([entry("terms", false), entry("privacy", true)]));
    expect(result.current).toBe("privacy");
  });

  it("keeps the last active section when none is in view", () => {
    const { result } = renderHook(() => useActiveSection(["terms", "privacy"]));
    act(() => callback([entry("privacy", true)]));
    act(() => callback([entry("privacy", false)]));
    expect(result.current).toBe("privacy");
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() => useActiveSection(["terms", "privacy"]));
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("returns null when there are no sections", () => {
    const { result } = renderHook(() => useActiveSection([]));
    expect(result.current).toBeNull();
  });
});
