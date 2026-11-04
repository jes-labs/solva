import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/ui/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { docsLink, routes } from "@/config/navigation";
import { DesktopNav } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="site-column flex h-16 items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link href={routes.home} aria-label="Solva home" className="flex items-center">
          <BrandLockup className="h-8" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <DesktopNav />
          <a
            href={docsLink.href}
            className="inline-flex h-9 items-center gap-1 rounded-btn px-3 text-small font-medium text-sec transition-colors hover:bg-raised hover:text-text"
          >
            {docsLink.label}
            <ArrowUpRightIcon aria-hidden="true" className="size-3" />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" variant="secondary" className="hidden xl:inline-flex">
            <Link href={routes.waitlist}>Waitlist</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={routes.contact}>Talk to us</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
