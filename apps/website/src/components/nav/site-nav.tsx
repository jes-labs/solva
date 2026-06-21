"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { SolutionsMenu } from "./solutions-menu";
import { leadNavItem, navItems } from "./nav-config";
import { routes } from "@/lib/routes";
import { isExternalHref } from "@/lib/is-external";
import { ThemeToggle } from "@/components/theme-toggle";

// The sticky site navigation. It condenses on scroll, exposes the Solutions
// mega-menu, marks the active route, and collapses to a menu button on small
// screens.
export function SiteNav() {
  const [condensed, setCondensed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating to a new route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={`nav-condensed flex items-center justify-center  border-hair px-7 transition-all duration-300 ${
          condensed ? "py-[11px] border-b" : "py-[18px]"
        }`}
      >
        <div className="flex w-full max-w-site items-center justify-between gap-6">
          <Logo />

          <div className="hidden items-center gap-7 text-[14.5px] font-medium lg:flex">
            <NavLink
              href={leadNavItem.href}
              active={isActive(leadNavItem.href)}
            >
              {leadNavItem.label}
            </NavLink>
            <SolutionsMenu />
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                href={item.href}
                active={isActive(item.href)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href={routes.app}
              className="hidden rounded-[9px] bg-acc px-[18px] py-[10px] text-sm font-semibold text-on-acc sm:inline-block"
            >
              Launch app
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="grid h-9 w-9 place-items-center rounded-btn border border-hair text-fg lg:hidden"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav-condensed border-b border-hair px-7 py-4 lg:hidden">
          <div className="mx-auto flex max-w-site flex-col gap-1">
            <MobileLink href={leadNavItem.href}>{leadNavItem.label}</MobileLink>
            <MobileLink href={routes.solutions}>Solutions</MobileLink>
            {navItems.map((item) => (
              <MobileLink key={item.label} href={item.href}>
                {item.label}
              </MobileLink>
            ))}
            <Link
              href={routes.app}
              className="mt-3 rounded-[9px] bg-acc px-[18px] py-[11px] text-center text-sm font-semibold text-on-acc"
            >
              Launch app
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const className = `transition-colors hover:text-fg ${active ? "text-fg" : "text-sec"}`;
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const className =
    "py-2 text-[15px] font-medium text-sec transition-colors hover:text-fg";
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
