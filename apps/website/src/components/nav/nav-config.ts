import { routes } from "@/lib/routes";

export interface NavItem {
  label: string;
  href: string;
}

// Product leads the row, then the Solutions mega-menu, then the rest. Keeping
// the lead item separate avoids array index access at the call site.
export const leadNavItem: NavItem = { label: "Product", href: routes.howItWorks };

export const navItems: NavItem[] = [
  { label: "Developers", href: routes.developers },
  { label: "Security", href: routes.security },
  { label: "Pricing", href: routes.pricing },
  { label: "Docs", href: routes.docs },
  { label: "Whitepaper", href: routes.whitepaper },
];

export interface SolutionCard {
  num: string;
  title: string;
  desc: string;
  href: string;
}

// The four segments shown in the Solutions mega-menu. All link to the Solutions
// page, which switches to the matching segment.
export const solutionCards: SolutionCard[] = [
  { num: "01", title: "Banks & fintechs", desc: "Continuous solvency for regulated balance sheets.", href: routes.solutions },
  { num: "02", title: "Exchanges", desc: "Proof of reserves that proves solvency.", href: routes.solutions },
  { num: "03", title: "Stablecoin issuers", desc: "Prove full backing, every block.", href: routes.solutions },
  { num: "04", title: "Regulators & auditors", desc: "Selective disclosure, on demand.", href: routes.solutions },
];
