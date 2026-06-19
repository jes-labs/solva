// Shared Prettier config for Solva.
// The root package.json runs `prettier --write` across the repo. Individual
// packages can import this if they want to run Prettier on their own.
//
// Note: Solva style forbids em-dashes in prose and comments. Prettier does not
// touch prose punctuation, so that rule is enforced by review, not by config.

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
};

export default config;
