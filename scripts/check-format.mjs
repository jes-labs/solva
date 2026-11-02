#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { changedFiles } from "./lib/changed-files.mjs";

const FORMATTED = /\.(js|mjs|cjs|ts|tsx|json|jsonc|css|md|mdx|yml|yaml)$/;
const files = changedFiles(FORMATTED);

if (files.length === 0) {
  console.log("No changed files to format-check.");
  process.exit(0);
}

const result = spawnSync("pnpm", ["exec", "prettier", "--check", "--ignore-unknown", ...files], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
