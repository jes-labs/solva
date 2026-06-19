import Link from "next/link";

// Plain top nav across the three surfaces. Server component, no interactivity.
const links = [
  { href: "/", label: "Dashboard" },
  { href: "/verify", label: "Verify a proof" },
  { href: "/inclusion", label: "Check my balance" },
];

export function SiteNav() {
  return (
    <nav className="mb-10 flex items-center gap-6 border-b border-border pb-4">
      <Link href="/" className="text-lg font-semibold">
        Solva
      </Link>
      <div className="flex gap-4 text-sm text-muted-foreground">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
