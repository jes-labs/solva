"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@solva/ui";
import { ThemeToggle } from "./theme-toggle";

// The product nav across the three surfaces. Sticky, brand-styled, and it marks
// the active route. Short labels so the row holds on small screens.
const links = [
  { href: "/", label: "Dashboard" },
  { href: "/verify", label: "Verify" },
  { href: "/inclusion", label: "Inclusion" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-bg">
      <nav className="mx-auto flex max-w-site items-center justify-between gap-4 px-7 py-3.5">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2" aria-label="Solva home">
            <svg viewBox="24 11 53 78" width="18" height="26" aria-hidden="true">
              <path
                d="M32.5 20 L67.5 41 L32.5 62 L32.5 80 L64.5 80"
                fill="none"
                stroke="var(--acc)"
                strokeWidth="14"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-[19px] font-bold tracking-tight text-fg">Solva</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px] sm:gap-6 sm:text-sm">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-fg",
                    active ? "text-fg" : "text-sec",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
