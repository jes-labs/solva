"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABELS } from "@/lib/session/permissions";
import type { Session } from "@/lib/session/types";

// The dashboard header: section title on the left, institution + role + operator
// and a sign-out on the right, plus the mobile menu trigger.
export function Topbar({
  title,
  session,
  onOpenMobile,
  onSignOut,
}: {
  title: string;
  session: Session;
  onOpenMobile: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-hair bg-bg px-5 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-btn border border-hair text-sec transition-colors hover:text-fg lg:hidden"
        >
          <Menu className="size-[18px]" />
        </button>
        <h1 className="font-display text-[18px] font-semibold tracking-tight">{title}</h1>
      </div>

      <div id="tour-account" className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-[13px] font-medium text-fg">
            {session.institution.legalName || "Your institution"}
          </div>
          <div className="font-mono text-[11px] text-sec">
            {ROLE_LABELS[session.role]} · {session.operatorLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-btn border border-hair px-3 py-1.5 text-[13px] text-fg transition-colors hover:border-hair-strong"
        >
          Sign out
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
