import type { Mock } from "vitest";
import { vi } from "vitest";

type Callback = (entries: IntersectionObserverEntry[]) => void;

export interface ObserverHandle {
  callback: Callback;
  observed: Element[];
  disconnect: Mock<() => void>;
}

export function installIntersectionObserver() {
  const handles: ObserverHandle[] = [];
  class MockObserver {
    handle: ObserverHandle;
    constructor(callback: Callback) {
      this.handle = { callback, observed: [], disconnect: vi.fn<() => void>() };
      handles.push(this.handle);
    }
    observe(node: Element) {
      this.handle.observed.push(node);
    }
    disconnect() {
      this.handle.disconnect();
    }
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", MockObserver);
  return handles;
}

export function entry(
  target: Element,
  isIntersecting: boolean,
  top = 0,
): IntersectionObserverEntry {
  const rect = {
    top,
    bottom: top,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: 0,
  };
}
