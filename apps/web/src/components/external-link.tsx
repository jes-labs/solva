import type { AnchorHTMLAttributes, ReactNode } from "react";

// A link to another Solva origin (the marketing site or the docs). Cross-origin
// destinations always open in a new tab.
export function ExternalLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}
