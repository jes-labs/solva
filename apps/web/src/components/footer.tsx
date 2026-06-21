import Link from "next/link";
import { ExternalLink } from "./external-link";
import { siteUrl, docsUrl } from "@/lib/links";

// A simple copyright footer shared by the dashboard and the public pages. It
// links to the public verify and inclusion tools, and out to the marketing site
// and docs, which live on their own origins.
export function Footer() {
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-7 py-5">
        <p className="font-mono text-xs text-sec">© 2026 Solva · reserves ≥ liabilities</p>
        <div className="flex flex-wrap items-center gap-5 text-[13px] text-sec">
          <Link href="/verify" className="transition-colors hover:text-fg">
            Verify a proof
          </Link>
          <Link href="/inclusion" className="transition-colors hover:text-fg">
            Check inclusion
          </Link>
          <ExternalLink href={siteUrl} className="transition-colors hover:text-fg">
            Website
          </ExternalLink>
          <ExternalLink href={docsUrl} className="transition-colors hover:text-fg">
            Docs
          </ExternalLink>
        </div>
      </div>
    </footer>
  );
}
