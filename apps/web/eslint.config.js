import { base } from "@solva/config/eslint.preset.js";

// Next's lint integration is configured via eslint-config-next when the team
// runs `next lint`. Here we extend the shared Solva base for `eslint .`.
export default [
  ...base,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
