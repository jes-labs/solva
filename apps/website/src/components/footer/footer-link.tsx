import Link from "next/link";

// A footer link with the accent underline-on-hover. The underline width is the
// text width only, set by the .footer-link rule in globals.
export function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="footer-link text-sec">
      {children}
    </Link>
  );
}
