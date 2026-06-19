import { routes } from "@/lib/routes";

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

// The footer link columns in display order. Hrefs resolve through the central
// route map, so they stay in step with the nav.
export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: routes.howItWorks },
      { label: "Verify", href: routes.verify },
      { label: "Pricing", href: routes.pricing },
      { label: "Security", href: routes.security },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Banks & fintechs", href: routes.solutions },
      { label: "Exchanges", href: routes.solutions },
      { label: "Stablecoin issuers", href: routes.solutions },
      { label: "Regulators", href: routes.solutions },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: routes.docs },
      { label: "API", href: `${routes.developers}#api` },
      { label: "SDK", href: routes.developers },
      { label: "Sandbox", href: routes.developers },
      { label: "Whitepaper", href: routes.whitepaper },
      { label: "Status", href: routes.status },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: routes.about },
      { label: "Blog", href: routes.blog },
      // Careers has no page yet. It stays a placeholder on purpose.
      { label: "Careers", href: "#" },
      { label: "Contact", href: routes.demo },
    ],
  },
];

// The legal links in the bottom bar.
export const footerLegalLinks: FooterLinkItem[] = [
  { label: "Privacy", href: routes.legal },
  { label: "Terms", href: routes.legal },
  { label: "Security", href: routes.security },
];
