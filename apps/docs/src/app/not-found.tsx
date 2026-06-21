import Link from "next/link";
import { Logo } from "@/components/shared/logo";

// Brand-aligned 404 with a single CTA back to the docs.
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Logo className="mb-8" />
      <p className="font-mono text-sm uppercase tracking-wider text-fd-primary">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-fd-muted-foreground">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center rounded-md bg-fd-primary px-5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Read the docs
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-fd-border px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
