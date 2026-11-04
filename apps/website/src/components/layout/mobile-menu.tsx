import Link from "next/link";
import { ArrowUpRightIcon, ListIcon, XIcon } from "@phosphor-icons/react/ssr";
import { BrandLockup } from "@/components/ui/brand";
import { docsLink, headerGroups, routes } from "@/config/navigation";
import { MenuScrollLock } from "./menu-scroll-lock";
import { PopoverLink } from "./popover-link";

const MENU_ID = "mobile-menu";

export function MobileMenu() {
  return (
    <>
      <button
        type="button"
        popoverTarget={MENU_ID}
        aria-label="Open menu"
        className="flex size-9 items-center justify-center rounded-btn border border-line text-text lg:hidden"
      >
        <ListIcon aria-hidden="true" className="size-4" />
      </button>
      <MenuScrollLock popoverId={MENU_ID} />
      <div
        id={MENU_ID}
        popover="auto"
        aria-label="Menu"
        data-lenis-prevent
        className="mobile-panel fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col bg-bg p-0 text-text"
      >
        <div className="flex h-16 flex-none items-center justify-between border-b border-line px-5">
          <Link href={routes.home} aria-label="Solva home">
            <BrandLockup className="h-8" />
          </Link>
          <button
            type="button"
            popoverTarget={MENU_ID}
            popoverTargetAction="hide"
            aria-label="Close menu"
            className="flex size-9 items-center justify-center rounded-btn border border-line"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav
          aria-label="Mobile"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5"
        >
          {headerGroups.map((group) => (
            <section
              key={group.label}
              aria-label={group.label}
              className="border-b border-line py-4"
            >
              <p className="text-small font-medium text-sec">{group.label}</p>
              <ul className="mt-2 grid grid-cols-1 gap-x-6">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <PopoverLink
                      href={link.href}
                      popoverId={MENU_ID}
                      className="flex min-h-10 items-center text-ui font-medium"
                    >
                      {link.label}
                    </PopoverLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <a
            href={docsLink.href}
            className="flex min-h-12 items-center gap-1.5 border-b border-line text-ui font-medium"
          >
            {docsLink.label}
            <ArrowUpRightIcon aria-hidden="true" className="size-3.5 text-faint" />
          </a>
        </nav>
        <div className="flex flex-none gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <PopoverLink
            href={routes.contact}
            popoverId={MENU_ID}
            className="flex h-11 flex-1 items-center justify-center rounded-btn border border-signal-border bg-signal text-small font-medium text-on-signal"
          >
            Talk to us
          </PopoverLink>
          <PopoverLink
            href={routes.waitlist}
            popoverId={MENU_ID}
            className="flex h-11 flex-1 items-center justify-center rounded-btn border border-line-strong text-small font-medium text-text"
          >
            Waitlist
          </PopoverLink>
        </div>
      </div>
    </>
  );
}
