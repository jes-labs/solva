import { site } from "./site";

export const routes = {
  home: "/",
  anchors: "/anchors",
  custodialApps: "/custodial-apps",
  howItWorks: "/how-it-works",
  coverageRecord: "/coverage-record",
  partners: "/partners",
  trust: "/trust",
  demo: "/demo",
  about: "/about",
  blog: "/blog",
  contact: "/contact",
  waitlist: "/waitlist",
  legal: "/legal",
} as const;

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  links: readonly NavLink[];
}

export const headerGroups: readonly NavGroup[] = [
  {
    label: "Solutions",
    links: [
      {
        label: "For anchors",
        href: routes.anchors,
        description: "Show holders and partners that your token is backed.",
      },
      {
        label: "For custodial apps",
        href: routes.custodialApps,
        description: "Prove your reserves cover what you owe customers, and let each one check.",
      },
      {
        label: "For partners",
        href: routes.partners,
        description: "Wallets, lending pools and auditors read coverage for free.",
      },
    ],
  },
  {
    label: "Product",
    links: [
      {
        label: "How it works",
        href: routes.howItWorks,
        description: "From your reserves to a public record, in five steps.",
      },
      {
        label: "The coverage record",
        href: routes.coverageRecord,
        description: "What your holders, partners and auditors see.",
      },
      {
        label: "See it work",
        href: routes.demo,
        description: "Run a real proof against Stellar Testnet, step by step.",
      },
    ],
  },
  {
    label: "Company",
    links: [
      {
        label: "About",
        href: routes.about,
        description: "Why Solva exists and how it is run.",
      },
      {
        label: "Trust",
        href: routes.trust,
        description: "What a record proves, what it does not, and where the product stands.",
      },
      {
        label: "Blog",
        href: routes.blog,
        description: "Notes from the team on reserves and coverage.",
      },
    ],
  },
];

export const docsLink: NavLink = { label: "Docs", href: site.docsUrl, external: true };

export const footerColumns: readonly NavGroup[] = [
  {
    label: "Solutions",
    links: [
      { label: "For anchors", href: routes.anchors },
      { label: "For custodial apps", href: routes.custodialApps },
      { label: "For partners", href: routes.partners },
    ],
  },
  {
    label: "Product",
    links: [
      { label: "How it works", href: routes.howItWorks },
      { label: "The coverage record", href: routes.coverageRecord },
      { label: "See it work", href: routes.demo },
      { label: "Join the waitlist", href: routes.waitlist },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: routes.about },
      { label: "Trust", href: routes.trust },
      { label: "Blog", href: routes.blog },
      { label: "Contact", href: routes.contact },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Documentation", href: site.docsUrl, external: true },
      { label: "GitHub", href: site.githubUrl, external: true },
      { label: "X", href: site.xUrl, external: true },
      { label: "Legal", href: routes.legal },
    ],
  },
];
