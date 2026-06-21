import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// The chrome for the public, no-auth pages (verify, inclusion). No dashboard
// links; just the brand, a way to reach the two public tools, and Launch app,
// which drops into the authenticated console.
export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-bg">
      <nav className="mx-auto flex max-w-site items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-7">
          <Logo />
          <div className="hidden items-center gap-5 text-sm text-sec sm:flex">
            <Link href="/verify" className="transition-colors hover:text-fg">
              Verify
            </Link>
            <Link href="/inclusion" className="transition-colors hover:text-fg">
              Inclusion
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-btn bg-acc px-4 py-2 text-[13.5px] font-semibold text-on-acc transition hover:-translate-y-px hover:shadow-cta"
          >
            Launch app
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
