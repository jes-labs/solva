import { base } from "@solva/config/eslint.preset.js";

export default [
  ...base,
  {
    // The generated client is machine-written and gitignored. Do not lint it.
    ignores: ["src/generated/**"],
  },
];
