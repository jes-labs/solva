import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const GENERATED =
  /(^|\/)(node_modules|\.next|\.open-next|\.wrangler|\.turbo|dist|target)\/|^packages\/contract-bindings\/|^pnpm-lock\.yaml$/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
}

export function changedFiles(pattern) {
  const base = process.env.CHANGED_BASE ?? "origin/main";
  const files = [
    ...git(["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`]),
    ...git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ];
  return [...new Set(files)].filter(
    (file) => pattern.test(file) && !GENERATED.test(file) && existsSync(file),
  );
}
