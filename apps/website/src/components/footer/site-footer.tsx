import { Logo } from "@/components/nav/logo";
import { FooterLink } from "./footer-link";
import { footerColumns, footerLegalLinks } from "./footer-config";

// The site footer: a brand column plus four link columns, then a bottom bar
// with the copyright and the legal links.
export function SiteFooter() {
  return (
    <footer className="relative z-[1] border-t border-hair bg-bg">
      <div className="mx-auto grid max-w-site grid-cols-2 gap-x-6 gap-y-10 px-7 pb-10 pt-14 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:gap-8">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-4">
            <Logo />
          </div>
          <p className="mb-4 max-w-[260px] text-sm leading-relaxed text-sec">
            Zero-knowledge proof of reserves infrastructure. Reserves greater
            than or equal to liabilities, verified on-chain.
          </p>
          <p className="font-mono text-[11.5px] text-sec">
            Built for the global market.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sec">
              {column.title}
            </p>
            <div className="flex flex-col gap-[11px] text-sm">
              {column.links.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-5 border-t border-hair px-7 pb-11 pt-[22px]">
        <p className="font-mono text-xs text-sec">
          © 2026 Solva · reserves ≥ liabilities
        </p>
        <div className="flex gap-[22px] text-[13px]">
          {footerLegalLinks.map((link, i) => (
            <FooterLink key={`${link.label}-${i}`} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
