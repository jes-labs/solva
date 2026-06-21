import Link from "next/link";

// A simple copyright footer shared by the dashboard and the public pages. It is
// the only place the authed dashboard links to the public verify and inclusion
// tools, since those sit outside the operator flow.
export function Footer() {
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-6 py-5">
        <p className="font-mono text-xs text-sec">© 2026 Solva · reserves ≥ liabilities</p>
        <div className="flex items-center gap-5 text-[13px] text-sec">
          <Link href="/verify" className="transition-colors hover:text-fg">
            Verify a proof
          </Link>
          <Link href="/inclusion" className="transition-colors hover:text-fg">
            Check inclusion
          </Link>
        </div>
      </div>
    </footer>
  );
}
