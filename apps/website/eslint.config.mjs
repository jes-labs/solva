import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const FEATURE_ENTRY = { element: { type: "feature", fileInternalPath: ["index.ts", "server.ts"] } };

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "coverage/**",
    ".worktrees/**",
    "next-env.d.ts",
    "src/lib/cn-tables.ts",
  ]),
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/set-state-in-render": "error",
      "react-hooks/no-deriving-state-in-effects": "error",
      "react-hooks/purity": "error",
      "react-hooks/refs": "error",
      "react-hooks/immutability": "error",
      "react-hooks/static-components": "error",
      "react-hooks/globals": "error",
      "react-hooks/error-boundaries": "error",
      "react-hooks/incompatible-library": "error",
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/features/*/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Components never fetch. Use a server module or a hook." },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "layout", pattern: "src/components/layout" },
        { type: "ui", pattern: "src/components/ui" },
        { type: "feature", pattern: "src/features/*", capture: ["featureName"] },
        { type: "hooks", pattern: "src/hooks" },
        { type: "lib", pattern: "src/lib" },
        { type: "config", pattern: "src/config" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "{{from.element.type}} may not import {{to.element.type}} here. See docs/architecture.md.",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: [
                  { element: { type: ["app", "layout", "ui", "hooks", "lib", "config"] } },
                  FEATURE_ENTRY,
                ],
              },
            },
            {
              from: { element: { type: "layout" } },
              allow: {
                to: [
                  { element: { type: ["layout", "ui", "hooks", "lib", "config"] } },
                  FEATURE_ENTRY,
                ],
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: [
                  {
                    element: {
                      type: "feature",
                      captured: { featureName: "{{from.element.captured.featureName}}" },
                    },
                  },
                  { element: { type: ["ui", "hooks", "lib", "config"] } },
                ],
              },
            },
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { type: ["ui", "hooks", "lib"] } } },
            },
            {
              from: { element: { type: "hooks" } },
              allow: { to: { element: { type: ["hooks", "lib", "config"] } } },
            },
            {
              from: { element: { type: "lib" } },
              allow: { to: { element: { type: ["lib", "config"] } } },
            },
            {
              from: { element: { type: "config" } },
              allow: { to: { element: { type: "config" } } },
            },
          ],
        },
      ],
    },
  },
]);
