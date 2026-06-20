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
  // The public verify tool lives in the product app. This becomes that app's
  // absolute URL once it is deployed.
  verify: "/verify",
  demo: "/request-a-demo",
  legal: "/legal",
  status: "/status",
  // The whitepaper is hosted externally rather than on a page; links to it open
  // in a new tab. Swap this URL if the document moves.
  whitepaper:
    "https://drive.google.com/file/d/1Dw3cdqTik4GZSMxB1Wckv230VRGUq538/view?usp=sharing",
  // Docs point at the Developers landing for now. They retarget to the docs
  // site once it is deployed.
  docs: "/developers",
} as const;
