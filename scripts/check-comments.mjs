#!/usr/bin/env node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { changedFiles } from "./lib/changed-files.mjs";

const MAX_LINES = 3;
const CODE_EXTENSIONS = /\.(ts|tsx|js|mjs|cjs)$/;
const CHECKED_EXTENSIONS = /\.(ts|tsx|js|mjs|cjs|css)$/;
const DIRECTIVE =
  /^(eslint-disable|eslint-enable|@ts-expect-error|prettier-ignore|#region|#endregion|\/ <reference)/;
const DASHES = /[–—]/;
const COMMENTED_CODE =
  /^(import|export|const|let|var|return|if|for|while|await|function)\b.*|[;{}]\s*$|=>\s*[{(]?\s*$|^<\/?[A-Z][\w.]*[\s/>]/;
const AI_PHRASES = [
  "robust",
  "seamless",
  "seamlessly",
  "elegant",
  "elegantly",
  "leverage",
  "leverages",
  "utilize",
  "utilizes",
  "comprehensive",
  "delve",
  "meticulous",
  "cutting-edge",
  "state-of-the-art",
  "best practice",
  "it's worth noting",
  "it is worth noting",
  "in order to",
  "this function",
  "this component",
  "this hook",
  "the following code",
  "helper function to",
];
const AI_PATTERN = new RegExp(`\\b(${AI_PHRASES.join("|")})\\b`, "i");

function filesToCheck() {
  const args = process.argv.slice(2);
  if (args.length > 0) return args.filter((file) => CHECKED_EXTENSIONS.test(file));
  return changedFiles(CHECKED_EXTENSIONS);
}

function codeComments(source, file) {
  const variant = file.endsWith(".tsx") ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, variant, source);
  const comments = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    if (
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      comments.push({ text: scanner.getTokenText(), start: scanner.getTokenStart() });
    }
  }
  return comments;
}

function cssComments(source) {
  return [...source.matchAll(/\/\*[\s\S]*?\*\//g)].map((match) => ({
    text: match[0],
    start: match.index,
  }));
}

function bodyLines(text) {
  return text
    .replace(/^\/\*\*?|\*\/$/g, "")
    .replace(/^\/\/\/?/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
    .filter(Boolean);
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function groupLineComments(comments, source) {
  const groups = [];
  for (const comment of comments) {
    const previous = groups.at(-1);
    const isLine = comment.text.startsWith("//");
    const gap = previous ? source.slice(previous.end, comment.start) : "";
    if (previous && isLine && previous.isLine && /^\s*\n\s*$/.test(gap)) {
      previous.lines.push(...bodyLines(comment.text));
      previous.end = comment.start + comment.text.length;
    } else {
      groups.push({
        isLine,
        start: comment.start,
        end: comment.start + comment.text.length,
        lines: bodyLines(comment.text),
      });
    }
  }
  return groups;
}

const problems = [];
for (const file of filesToCheck()) {
  const source = readFileSync(file, "utf8");
  const raw = CODE_EXTENSIONS.test(file) ? codeComments(source, file) : cssComments(source);
  const comments = raw.filter((comment) => !DIRECTIVE.test(bodyLines(comment.text)[0] ?? ""));
  for (const group of groupLineComments(comments, source)) {
    const where = `${file}:${lineOf(source, group.start)}`;
    const text = group.lines.join(" ");
    if (group.lines.length > MAX_LINES) {
      problems.push(`${where} comment is ${group.lines.length} lines; keep it to ${MAX_LINES}`);
    }
    if (DASHES.test(text)) problems.push(`${where} comment uses an em or en dash`);
    const phrase = text.match(AI_PATTERN);
    if (phrase) problems.push(`${where} comment uses filler phrase "${phrase[0]}"`);
    if (group.lines.some((line) => COMMENTED_CODE.test(line))) {
      problems.push(`${where} looks like commented-out code; delete it`);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(
    `\n${problems.length} comment problem(s). See docs/engineering-standards.md#comments.`,
  );
  process.exit(1);
}
