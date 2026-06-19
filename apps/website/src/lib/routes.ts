// Central route map for the marketing site. The nav and footer both read from
// here, so a path change happens in one place. Pages are added per issue, so
// some of these targets do not exist yet and will resolve once their page lands.
export const routes = {
  home: "/",
  howItWorks: "/how-it-works",
  solutions: "/solutions",
  developers: "/developers",
  security: "/security",
  oracle: "/solvency-oracle",
  pricing: "/pricing",
  blog: "/blog",
  about: "/about",
  demo: "/request-a-demo",
  legal: "/legal",
  status: "/status",
  whitepaper: "/whitepaper",
  // Docs point at the Developers landing for now. They retarget to the docs
  // site once it is deployed.
  docs: "/developers",
} as const;
