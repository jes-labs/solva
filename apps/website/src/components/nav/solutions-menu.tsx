"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { solutionCards } from "./nav-config";

// The Solutions nav item with its mega-menu. It opens on hover and on keyboard
// focus, and closes on mouse leave, on Escape, or when focus leaves the group.
// The wrapper carries a transparent padding bridge so the cursor can cross the
// gap from the trigger into the panel without the menu closing.
export function SolutionsMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative -mb-[22px] pb-[22px]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sec transition-colors hover:text-fg"
      >
        Solutions
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full w-[520px] -translate-x-1/2 rounded-2xl border border-hair bg-surface p-3 shadow-dropdown">
          <div className="grid grid-cols-2 gap-1.5">
            {solutionCards.map((card) => (
              <Link
                key={card.num}
                href={card.href}
                className="flex gap-3 rounded-[10px] border border-transparent p-3.5 transition-colors hover:border-hair hover:bg-panel"
              >
                <span className="pt-0.5 font-mono text-xs text-acc-text">{card.num}</span>
                <span>
                  <span className="block text-[14.5px] font-semibold text-fg">{card.title}</span>
                  <span className="mt-0.5 block text-[13px] text-sec">{card.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
