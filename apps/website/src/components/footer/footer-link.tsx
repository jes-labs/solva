import Link from "next/link";
import { isExternalHref } from "@/lib/is-external";

// A footer link with the accent underline-on-hover. The underline width is the
// text width only, set by the .footer-link rule in globals. External targets
// (the whitepaper) open in a new tab.
export function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="footer-link text-sec">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="footer-link text-sec">
      {children}
    </Link>
  );
}
