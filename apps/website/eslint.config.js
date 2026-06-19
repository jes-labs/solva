import { base } from "@solva/config/eslint.preset.js";

// The marketing site extends the shared Solva base for `eslint .`.
export default [
  ...base,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
