"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Landmark, ScrollText, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@solva/ui";
import { Logo } from "@/components/logo";
import type { Role } from "@/lib/session/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

const ALL_ROLES: readonly Role[] = ["owner", "compliance", "operator", "viewer"];

const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/sources", label: "Sources", icon: Landmark, roles: ALL_ROLES },
  { href: "/activity", label: "Activity", icon: ScrollText, roles: ALL_ROLES },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "compliance"] },
];

// The dashboard sidebar: brand-styled, role-filtered, fixed on desktop and an
// off-canvas drawer on mobile. Only the sections a role may use are shown.
export function Sidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-hair bg-surface transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-hair px-5">
          <Logo />
        </div>

        <nav id="tour-nav" className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-panel text-fg" : "text-sec hover:bg-panel/60 hover:text-fg",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-acc transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className={cn("size-[18px] shrink-0", active && "text-acc-text")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-hair p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-sec">
            Reserves ≥ liabilities
          </p>
        </div>
      </aside>
    </>
  );
}
