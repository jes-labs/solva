"use client";

import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";

export function nextDayIndex(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return Math.min(index + 1, count - 1);
  if (key === "ArrowLeft" || key === "ArrowUp") return Math.max(index - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

export function useDayPicker(count: number) {
  const [selected, setSelected] = useState(count - 1);
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  function register(index: number) {
    return (node: HTMLButtonElement | null) => {
      if (node) buttons.current.set(index, node);
      else buttons.current.delete(index);
    };
  }

  function select(index: number) {
    if (index >= 0 && index < count) setSelected(index);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextDayIndex(event.key, index, count);
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    buttons.current.get(next)?.focus();
  }

  return { selected, select, register, handleKeyDown };
}
