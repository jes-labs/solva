// Shared ESLint flat config preset for Solva TypeScript packages.
// Other packages import this and spread it into their own eslint.config.js.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

// Base preset: recommended JS + typed TS rules, with Prettier turning off
// any stylistic rules that would fight the formatter.
export const base = tseslint.config(
  {
    ignores: ["dist/**", ".next/**", "node_modules/**", "**/generated/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Allow intentionally unused args when prefixed with an underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);

export default base;
